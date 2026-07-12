var API_VERIFY_URL = 'https://script.google.com/macros/s/AKfycbz1f5qTVq1pPOVnZU_NIqsPckPu6Nr09AT98s5fBTpewmsxkjrT2Hczpny9Q4zcMoo/exec';
var STORAGE_KEY_NAME = 'challan_user_api_key';
var STORAGE_BALANCE_CACHE = 'challan_user_balance_cache';

function fetchLicenseFromServer(apiKey) {
    return new Promise(function(resolve) {
        if (!apiKey) {
            resolve({ valid: false, error: 'Please enter an API Key' });
            return;
        }
        GM_xmlhttpRequest({
            method: "POST",
            url: API_VERIFY_URL,
            data: JSON.stringify({ apiKey: apiKey }),
            headers: { "Content-Type": "application/json" },
            onload: function(response) {
                try {
                    var resData = JSON.parse(response.responseText);
                    if (resData && resData.valid) {
                        localStorage.setItem(STORAGE_BALANCE_CACHE, resData.remaining);
                    }
                    resolve(resData);
                } catch (e) {
                    resolve({ valid: false, error: 'Invalid response' });
                }
            },
            onerror: function() {
                resolve({ valid: false, error: 'Connection Failed' });
            }
        });
    });
}

function initUI() {
    if (document.getElementById('custom-panel')) return;

    var style = document.createElement('style');
    style.innerHTML = `
        #custom-panel {
            position: fixed; top: 15px; left: 15px; z-index: 99999;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafd 100%);
            border-radius: 16px; padding: 20px;
            box-shadow: 0 10px 30px rgba(40, 167, 69, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
            width: 325px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            border: 1px solid rgba(40, 167, 69, 0.2); transition: all 0.3s ease;
        }
        #custom-panel h3 {
            margin: 0 0 15px 0; font-size: 24px; text-align: center; font-weight: 800;
            background: linear-gradient(45deg, #ff007f, #7f00ff, #007fff, #00ff7f);
            background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            animation: gradientMove 6s ease infinite; letter-spacing: 1px;
        }
        @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .form-group { margin-bottom: 10px; }
        .form-group label {
            display: block; font-size: 11.5px; font-weight: 700; margin-bottom: 4px;
            color: #4a5568; text-transform: uppercase; letter-spacing: 0.3px;
        }
        .form-group input, .form-group textarea {
            width: 100%; padding: 7px 10px; box-sizing: border-box;
            border: 1.5px solid #e2e8f0; border-radius: 8px;
            font-size: 13px; font-weight: 500; color: #2d3748; background-color: #ffffff;
            transition: all 0.2s ease;
        }
        .form-group input:focus, .form-group textarea:focus {
            outline: none; border-color: #28a745; box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.15);
        }
        .top-action-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; margin-bottom: 12px; }
        .mode-toggle-container { display: flex; background: #edf2f7; padding: 3px; border-radius: 10px; border: 1px solid #e2e8f0; }
        .mode-toggle-container label { padding: 5px 12px; font-size: 11px; font-weight: 700; cursor: pointer; margin-bottom: 0; border-radius: 7px; transition: all 0.25s ease; color: #4a5568; }
        .mode-toggle-container input[type="radio"] { display: none; }
        .mode-toggle-container input[type="radio"]:checked + span {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; display: block; margin: -5px -12px; padding: 5px 12px; border-radius: 7px; box-shadow: 0 2px 6px rgba(0, 123, 255, 0.3);
        }
        .mode-toggle-container input[value="bkash"]:checked + span {
            background: linear-gradient(135deg, #d12053 0%, #b11343 100%); box-shadow: 0 2px 6px rgba(209, 32, 83, 0.3);
        }
        #reset-btn {
            padding: 5px 14px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%);
            color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 11px;
            cursor: pointer; box-shadow: 0 2px 5px rgba(238, 82, 83, 0.2); transition: all 0.2s;
        }
        #reset-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(238, 82, 83, 0.3); }
        
        .action-btn-container { margin-top: 12px; }
        #send-btn {
            width: 100%; padding: 10px; background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
            color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 700;
            cursor: pointer; box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2); transition: all 0.2s ease;
        }
        #send-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(40, 167, 69, 0.3); }
        #save-key-btn {
            width: 100%; padding: 8px; background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
            color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 6px;
        }
        .api-section { border-bottom: 2px dashed #e2e8f0; padding-bottom: 12px; margin-bottom: 10px; text-align: center; }
        #key-status-display {
            font-size: 12px; font-weight: 700; color: #1a365d; padding: 8px;
            background: linear-gradient(135deg, #ebf8ff 0%, #cee8ff 100%); border-radius: 8px; display: none; border: 1px solid #bee3f8; line-height: 1.5;
        }
        .template-btn-container { display: flex; gap: 8px; margin-top: 8px; margin-bottom: 12px; }
        .template-btn {
            flex: 1; padding: 6px; font-size: 11px; font-weight: 700; color: #4a5568; background: #ffffff; border: 1px solid #cbd5e0; border-radius: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .template-btn:hover { background: #f7fafc; border-color: #4a5568; color: #1a202c; transform: translateY(-1px); }
        #status-msg { font-size: 12px; margin-top: 8px; text-align: center; font-weight: 700; line-height: 1.4; }
    `;
    document.head.appendChild(style);

    var panel = document.createElement('div');
    panel.id = 'custom-panel';
    var savedKey = localStorage.getItem(STORAGE_KEY_NAME) || '';

    panel.innerHTML = `
        <h3>আলম চান</h3>
        <div class="api-section">
            <div id="key-input-area">
                <div class="form-group">
                    <label style="color: #4a5568; text-align: left;">Enter Your API Key:-</label>
                    <input type="text" id="inp-apikey" value="${savedKey}" placeholder="Paste API Key Here">
                </div>
                <button id="save-key-btn">Save & Verify Key</button>
            </div>
            <div id="key-status-display"></div>
        </div>
        <div class="top-action-bar">
            <div class="mode-toggle-container">
                <label><input type="radio" name="payment-mode" value="self_bank" checked><span>Self & Bank</span></label>
                <label><input type="radio" name="payment-mode" value="bkash"><span>bKash</span></label>
            </div>
            <button type="button" id="reset-btn">Reset</button>
        </div>
        <div id="main-form">
            <div class="form-group"><label>উৎসে কর টাকার পরিমাণ / Amount :- </label><input type="text" inputmode="numeric" id="inp-amount" value=""></div>
            <div class="form-group"><label>Mobile Number :-</label><input type="text" inputmode="numeric" id="inp-mobile" value="" maxlength="11"></div>
            <div class="form-group"><label>নাম/Name(ENGLISH) :-</label><input type="text" id="inp-name" value=""></div>
            <div class="form-group"><label>সনাক্তকরণ নম্বর NID :-</label><input type="text" inputmode="numeric" id="inp-identity" value=""></div>
            <div class="form-group"><label>ঠিকানা :-</label><input type="text" id="inp-address" value=""></div>
            <div class="form-group"><label>মন্তব্য/Remarks :-</label><textarea id="inp-remarks" rows="3"></textarea></div>
            <div class="template-btn-container">
                <button type="button" class="template-btn" id="btn-khosh-kobla">খোষ কবলা পত্র</button>
                <button type="button" class="template-btn" id="btn-heba-ghoshona">হেবার ঘোষণা পত্র</button>
            </div>
            <div class="action-btn-container"><button id="send-btn">Send Request</button></div>
            <div id="status-msg"></div>
        </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('reset-btn').addEventListener('click', function() {
        document.getElementById('inp-amount').value = '';
        document.getElementById('inp-mobile').value = '';
        document.getElementById('inp-name').value = '';
        document.getElementById('inp-identity').value = '';
        document.getElementById('inp-address').value = '';
        document.getElementById('inp-remarks').value = '';
        var status = document.getElementById('status-msg');
        status.innerText = 'Form Cleared! 🧹'; status.style.color = '#dc3545';
        setTimeout(function() { if(status.innerText === 'Form Cleared! 🧹') status.innerText = ''; }, 2000);
    });

    document.getElementById('btn-khosh-kobla').addEventListener('click', function() {
        document.getElementById('inp-remarks').value = "মূল্য:- 000, খোষ কবলা পত্র, মৌজা:- 000, R.S খতিয়ান নং:- 00, বর্তমান প্রস্তাবিত:- 000, দাগ নং:- 000";
    });
    document.getElementById('btn-heba-ghoshona').addEventListener('click', function() {
        document.getElementById('inp-remarks').value = "মূল্য:- 000, হেবার ঘোষণা পত্র, মৌজা:- 000, R.S খতিয়ান নং:- 00, বর্তমান প্রস্তাবিত:- 000, দাগ নং:- 000";
    });

    async function updateKeyUI(forceRefreshFromServer) {
        var key = localStorage.getItem(STORAGE_KEY_NAME);
        var inputArea = document.getElementById('key-input-area');
        var statusDisplay = document.getElementById('key-status-display');
        if (key) {
            inputArea.style.display = 'none'; statusDisplay.style.display = 'block';
            var cachedBalance = localStorage.getItem(STORAGE_BALANCE_CACHE);
            if (cachedBalance !== null && !forceRefreshFromServer) {
                statusDisplay.innerHTML = `Key Active ✅ <br><span style="color: #28a745;">Remaining: ${cachedBalance}</span><br><a href="#" id="reset-key-lnk" style="font-size:11px; color:#718096; text-decoration:none; font-weight:bold;">[Change Key]</a>`;
                document.getElementById('reset-key-lnk').addEventListener('click', resetKey);
            } else {
                statusDisplay.innerText = 'Checking Key Balance...';
                var res = await fetchLicenseFromServer(key);
                if (res.valid) {
                    statusDisplay.innerHTML = `Key Active ✅ <br><span style="color: #28a745;">Remaining: ${res.remaining}</span><br><a href="#" id="reset-key-lnk" style="font-size:11px; color:#718096; text-decoration:none; font-weight:bold;">[Change Key]</a>`;
                    document.getElementById('reset-key-lnk').addEventListener('click', resetKey);
                } else {
                    statusDisplay.innerHTML = `Key Error ❌ (${res.error || 'Invalid'}) <br><a href="#" id="reset-key-lnk" style="font-size:11px; color:#e53e3e; font-weight:bold;">Reset Key</a>`;
                    document.getElementById('reset-key-lnk').addEventListener('click', resetKey);
                }
            }
        } else {
            inputArea.style.display = 'block'; statusDisplay.style.display = 'none';
        }
    }

    function resetKey(e) {
        if(e) e.preventDefault();
        localStorage.removeItem(STORAGE_KEY_NAME); localStorage.removeItem(STORAGE_BALANCE_CACHE);
        updateKeyUI();
    }

    function restrictToPattern(inputEl, pattern) {
        inputEl.addEventListener('input', function() {
            var cleaned = inputEl.value.replace(pattern, '');
            if (cleaned !== inputEl.value) inputEl.value = cleaned;
        });
    }
    restrictToPattern(document.getElementById('inp-amount'), /[^0-9]/g);
    restrictToPattern(document.getElementById('inp-mobile'), /[^0-9]/g);
    restrictToPattern(document.getElementById('inp-identity'), /[^0-9]/g);
    restrictToPattern(document.getElementById('inp-name'), /[^A-Za-z ]/g);

    document.getElementById('save-key-btn').addEventListener('click', async function() {
        var key = document.getElementById('inp-apikey').value.trim();
        if(!key) return alert('Please enter a key!');
        localStorage.setItem(STORAGE_KEY_NAME, key); await updateKeyUI(true);
    });

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    document.getElementById('send-btn').addEventListener('click', async function() {
        var status = document.getElementById('status-msg');
        var apiKey = localStorage.getItem(STORAGE_KEY_NAME);
        if (!apiKey) {
            status.innerText = 'Please save your API key first!'; status.style.color = '#dc3545'; return;
        }
        var amountStr = document.getElementById('inp-amount').value.trim();
        var mobile = document.getElementById('inp-mobile').value.trim();
        var nameEn = document.getElementById('inp-name').value.trim();
        var identityNo = document.getElementById('inp-identity').value.trim();
        var address = document.getElementById('inp-address').value.trim();
        var remarks = document.getElementById('inp-remarks').value.trim();

        if (!amountStr || !mobile || !nameEn || !identityNo || !address || !remarks) {
            status.innerText = 'Error: Please fill up all fields first! ❌'; status.style.color = '#dc3545'; return;
        }
        if (mobile.length < 11) {
            status.innerText = 'Mobile No must be at least 11 digits'; status.style.color = '#dc3545'; return;
        }

        status.innerText = 'Sending Challan Data... ⏳'; status.style.color = '#dd6b20';
        var amount = parseFloat(amountStr) || 0;
        var selectedMode = document.querySelector('input[name="payment-mode"]:checked').value;
        var cashChequeData = selectedMode === 'bkash' ? 
            [{ "Id": 0, "AmountTypeId": 4, "OnlineBankId": 990, "Amount": amount }] : 
            [{ "Id": 0, "AmountTypeId": 6, "OnlineBankId": "", "Amount": amount }];

        var payload = {
            "challanData": {
                "CashCheque": cashChequeData,
                "ChallanNo": null, "ChallanTypeId": 4, "ClientOrgId": 26471415, "ClientTypeId": 3,
                "Economic": [{ "Id": "", "Name": "1111101 - ব্যক্তি কর্তৃক দেয় আয়কর", "Amount": amount, "EconomicId": 114, "OrganizationId": "" }],
                "Email": null, "Id": null, "IncomeTaxLawId": 279, "IncomeTaxYearId": 30, "IsDraft": true, "MobileNo": mobile,
                "NameBn": "1210603105805-সাব-রেজিস্ট্রার এর কার্যালয়, পত্নিতলা, নওগাঁ",
                "NameEn": "1210603105805-Office of the Sub-Registrar, Patnitala, Naogaon",
                "OrganaizationId": 150740835, "PersonIdentityNo": identityNo, "PersonIdentityTypeId": 6, "PersonNameEn": nameEn,
                "PersonPresentAddress": address, "Remarks": remarks, "VersionNo": null, "DepositorType": 3, "PersonTabName": "other",
                "ANumber": null, "RNumber": null, "CustomsRegistrationYear": null, "CustomsOfficeCode": null
            }
        };

        var finalXsrf = getCookie('XSRF-TOKEN') || getCookie('XSRF_TOKEN') || document.cookie.match(/XSRF-TOKEN=([^;]*)/)?.[1];
        var rvToken = document.querySelector('input[name="__RequestVerificationToken"]')?.value || document.querySelector('meta[name="__RequestVerificationToken"]')?.getAttribute('content');

        GM_xmlhttpRequest({
            method: "POST",
            url: "https://www.achallan.gov.bd/acs/general/SaveClientData",
            data: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json; charset=UTF-8', 'accept': 'application/json, text/plain, */*',
                'x-xsrf-token': finalXsrf ? decodeURIComponent(finalXsrf) : '', 'RequestVerificationToken': rvToken || ''
            },
            onload: async function(response) {
                if (response.status >= 200 && response.status < 300) {
                    try {
                        var resData = JSON.parse(response.responseText);
                        if (resData && resData.URL) {
                            status.innerText = 'Redirecting to bKash Payment... 🚀'; status.style.color = '#28a745';
                            await updateKeyUI(true); window.open(resData.URL, '_blank');
                        } else {
                            var challanNo = Array.isArray(resData) ? resData[0]?.CHALLAN_NO : resData?.CHALLAN_NO;
                            if (challanNo) {
                                status.innerText = `Success! Saved: ${challanNo}`; status.style.color = '#28a745';
                                await updateKeyUI(true);
                                var slipUrl = 'https://www.achallan.gov.bd/acs/general/ChallanSlipDraftViewPage?challanNo=' + encodeURIComponent(challanNo);
                                window.open(slipUrl, '_blank');
                            } else {
                                status.innerText = 'Saved but Challan No / URL missing.'; status.style.color = '#dd6b20';
                            }
                        }
                    } catch(e) {
                        status.innerText = 'Success! Request Sent.'; status.style.color = '#28a745';
                    }
                } else {
                    status.innerText = 'Challan System Error: ' + response.status; status.style.color = '#dc3545';
                }
            },
            onerror: function() {
                status.innerText = 'Challan System Submission Failed'; status.style.color = '#dc3545';
            }
        });
    });

    updateKeyUI(false);
}

initUI();
            
