// ==UserScript==
// @name         FortiCare Loadstat
// @author       Nico Angelo Abanes and Carnil Anthony De Lara
// @namespace    http://userscripts.frval.fortinet-emea.com/
// @version      v1.0
// @description  Automates the tracking of calls, tickets, and FTS.
// @grant        none
// @include      https://forticare.fortinet.com/CustomerSupport/SupportTeam/EditTicket.aspx*
// @include      https://forticare.fortinet.com/CustomerSupport/SupportTeam/BrowseTicket.aspx*
// ==/UserScript==

'use strict';

$(document).ready(function () {

    const SHAREPOINT_LINK = 'https://fortinet.sharepoint.com/sites/APACLoadStat/Shared%20Documents/Forms/AllItems.aspx?csf=1&web=1&e=x64b7c&CID=f588e06d%2D1a5b%2D42f2%2D928a%2D60e6c41caa0a&FolderCTID=0x012000DE297452E6640B4EA6AA9520F3DF0077&id=%2Fsites%2FAPACLoadStat%2FShared%20Documents%2FAPAC%20Load%20Stat';

    function cleanForExcel(v) {
        return (v || '').toString().replace(/[\r\n]+/g, ' ').trim();
    }

    const loadstatStyle = `
        #loadstatBackdrop { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.3); z-index:9998; }
        #loadstatForm {
            display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
            background:#fff; padding:18px 25px; border-radius:8px;
            box-shadow:0 6px 18px rgba(0,0,0,0.1); z-index:9999; width:450px;
            font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-height:85vh; overflow-x:hidden; overflow-y:hidden;
            border:1px solid #dcdcdc; box-sizing: border-box;
        }
        #loadstatForm.scrollable { overflow-y:auto; }
        #loadstatForm #loadstatFormTitle {
            background-color:#28aa45; color:#fff; padding:12px 0;
            margin:-18px -25px 20px -25px; text-align:center;
            font-size:22px; font-weight:600; border-radius:8px 8px 0 0;
            letter-spacing:1.5px; text-transform:uppercase;
        }
        #loadstatForm .form-group { margin-bottom:12px; }
        #loadstatForm label { display:block; margin-bottom:5px; font-weight:600; font-size:14px; color:#333; }
        #loadstatForm input, #loadstatForm select, #loadstatForm textarea {
            width:100%; padding:8px 10px; box-sizing:border-box;
            border:1px solid #d0d0d0; border-radius:4px; font-size:15px;
            background-color:#f5f5f5; transition:border-color 0.2s, box-shadow 0.2s;
        }
        #loadstatForm input:focus, #loadstatForm select:focus, #loadstatForm textarea:focus {
            border-color:#9ACD32; outline:none; box-shadow:0 0 0 2px rgba(178,223,219,0.5); background-color:#fff;
        }
        #loadstatForm textarea { resize:vertical; min-height:70px; max-height:130px; }
        .section-divider { margin:15px 0 10px 0; padding:5px 0; display:flex; justify-content:center; align-items:center; }
        .fts-toggle-container { display:flex; align-items:center; justify-content:center; gap:8px; font-weight:600; font-size:15px; color:#000; white-space:nowrap; }
        #ftsFields { display:none; transition:all 0.25s ease; }
        .button-group { display:flex; gap:8px; margin-top:14px; flex-wrap:nowrap; }
        #loadstatForm button {
            padding:10px 15px; border:none; border-radius:6px; cursor:pointer;
            font-weight:600; font-size:15px; flex:1; transition:background-color 0.2s;
            color:#fff; white-space:nowrap; text-align:center;
        }
        #submitLoadstat { background-color:#28aa45; }
        #submitLoadstat:hover { background-color:#27AE60; }
        #closeLoadstat { background-color:#D32F2F; }
        #closeLoadstat:hover { background-color:#C0392B; }
        #loadstatWaitPrompt {
            display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
            background:#fff; border:1px solid #dcdcdc; border-radius:8px;
            padding:20px 30px; box-shadow:0 6px 20px rgba(0,0,0,0.1);
            z-index:10000; font-size:16px; color:#333; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        /* ✅ Added only these two rules below */
        #loadstatButton {
            margin-left: 5px !important;
        }
        #loadstatButton:hover {
            background-color: #2ECC71 !important;
            color: #fff !important;
        }
    `;
    $('head').append(`<style>${loadstatStyle}</style>`);

    const loadstatHtml = `
        <div id="loadstatBackdrop"></div>
        <div id="loadstatWaitPrompt">Fetching customer information, please wait...</div>
        <div id="loadstatForm">
            <h1 id="loadstatFormTitle">LOADSTAT FORM</h1>
            <form id="loadstatDataForm">
                <div class="form-group"><label for="loadstatTicketNumber">Ticket Number:</label><input type="text" id="loadstatTicketNumber" readonly required></div>
                <div class="form-group"><label for="loadstatEngrName">Owner:</label><input type="text" id="loadstatEngrName" required></div>
                <div class="form-group"><label for="loadstatTicketTitle">Ticket Title:</label><input type="text" id="loadstatTicketTitle" readonly required></div>
                <div class="form-group"><label for="loadstatPriority">Priority:</label><input type="text" id="loadstatPriority" readonly required></div>
                <div class="form-group"><label for="loadstatCompanyName">Company Name:</label><input type="text" id="loadstatCompanyName" readonly required></div>
                <div class="form-group"><label for="loadstatModel">Model:</label><input type="text" id="loadstatModel" readonly required></div>
                <div class="form-group"><label for="loadstatCountry">Country:</label><input type="text" id="loadstatCountry" maxlength="30" list="loadstatCountryHistory" required></div>
                <datalist id="loadstatCountryHistory"></datalist>
                <div class="form-group"><label for="loadstatComments">Comments:</label><textarea id="loadstatComments" placeholder="Enter comments here..."></textarea></div>

                <div class="section-divider">
                    <div class="fts-toggle-container">
                        <span>FILL OUT FTS SECTION?</span>
                        <input type="checkbox" id="ftsToggle" style="transform:scale(1.2); vertical-align:middle;">
                    </div>
                </div>

                <div id="ftsFields">
                    <div class="form-group"><label for="loadstatFtsRegion">FTS/Call Region:</label>
                        <select id="loadstatFtsRegion"><option value="">Select Region</option><option>APAC</option><option>AMER</option><option>ANZ</option><option>EMEA</option><option>LATAM</option></select>
                    </div>
                    <div class="form-group"><label for="loadstatFtsOwnership">FTS TKT Ownership:</label>
                        <select id="loadstatFtsOwnership"><option value="">Select</option><option>Yes</option><option>No</option></select>
                    </div>
                    <div class="form-group"><label for="loadstatStartTime">Call Started:</label>
                        <div style="display:flex;"><input type="text" id="loadstatStartTime" placeholder="HH:MM" style="width:70%;"/><select id="loadstatStartAmPm" style="width:30%;"><option>AM</option><option>PM</option></select></div>
                    </div>
                    <div class="form-group"><label for="loadstatEndTime">Call Ended:</label>
                        <div style="display:flex;"><input type="text" id="loadstatEndTime" placeholder="HH:MM" style="width:70%;"/><select id="loadstatEndAmPm" style="width:30%;"><option>AM</option><option>PM</option></select></div>
                    </div>
                </div>

                <div class="button-group">
                    <button type="submit" id="submitLoadstat">Proceed to Sharepoint</button>
                    <button type="button" id="closeLoadstat">Cancel</button>
                </div>
            </form>
        </div>
    `;
    $('body').append(loadstatHtml);

    const loadstatBackdrop = $('#loadstatBackdrop');
    const loadstatFormModal = $('#loadstatForm');
    const waitPrompt = $('#loadstatWaitPrompt');

    $('#ftsToggle').on('change', function () {
        if (this.checked) {
            $('#ftsFields').slideDown(200);
            $('#ftsFields select, #ftsFields input').prop('required', true);
            loadstatFormModal.addClass('scrollable');
        } else {
            $('#ftsFields').slideUp(200);
            $('#ftsFields select, #ftsFields input').prop('required', false);
            loadstatFormModal.removeClass('scrollable');
        }
    });

    function showLoadstatModal() {
        const fullText = $('#ctl00_MainContent_UC_NotePadMessage_L_TicketId').text();
        const ticketNumber = fullText.replace('Ticket Number:', '').replace('(refresh)', '').trim();
        $('#loadstatTicketNumber').val(ticketNumber);

        const currentOwner = $('#ctl00_MainContent_LB_CurrentOwner').text().trim();
        if (currentOwner) $('#loadstatEngrName').val(currentOwner);

        const ticketTitle = $('#ctl00_MainContent_TB_TicketTitle').val()?.trim() || '';
        $('#loadstatTicketTitle').val(ticketTitle);

        const priorityVal = $('#ctl00_MainContent_DDL_Priority option:selected').text().trim();
        $('#loadstatPriority').val(priorityVal);

        waitPrompt.fadeIn(150);
        fetchCustomerInfo(() => {
            waitPrompt.fadeOut(150, () => {
                loadstatBackdrop.fadeIn();
                loadstatFormModal.fadeIn();
            });
        });
    }

    function hideLoadstatModal() {
        loadstatBackdrop.fadeOut();
        loadstatFormModal.fadeOut();
        $('#loadstatDataForm')[0].reset();
        $('#ftsFields').hide();
        loadstatFormModal.removeClass('scrollable');
    }

    function formatTimeLoadstat(v) {
        v = v.replace(/[^0-9]/g, '').slice(0, 4);
        let h = 0, m = 0;
        if (v.length <= 2) h = parseInt(v) || 0;
        else if (v.length === 3) { h = parseInt(v[0]); m = parseInt(v.slice(1)); }
        else { h = parseInt(v.slice(0, 2)); m = parseInt(v.slice(2)); }
        if (h > 12 || m > 59) return '';
        return h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
    }

    $('#loadstatStartTime,#loadstatEndTime').on('blur keyup', function (e) {
        if (e.type === 'blur' || e.key === 'Enter') $(this).val(formatTimeLoadstat($(this).val()));
    });

    // ✅ Excel Copy Logic with Tab Skips
    $('#loadstatDataForm').on('submit', function (e) {
        e.preventDefault();

        const isFTSChecked = $('#ftsToggle').is(':checked');
        const vals = [
            $('#loadstatTicketNumber').val(),    // Skip 3
            $('#loadstatEngrName').val(),
            $('#loadstatTicketTitle').val(),
            $('#loadstatPriority').val(),        // Skip 3
            $('#loadstatCompanyName').val(),     // Skip 2
            $('#loadstatModel').val(),
            $('#loadstatCountry').val(),         // Skip 1
            $('#loadstatComments').val(),
            isFTSChecked ? $('#loadstatFtsRegion').val() : '',
            isFTSChecked ? $('#loadstatFtsOwnership').val() : '',
            isFTSChecked ? ($('#loadstatStartTime').val() + ' ' + $('#loadstatStartAmPm').val()) : '',
            isFTSChecked ? ($('#loadstatEndTime').val() + ' ' + $('#loadstatEndAmPm').val()) : ''
        ].map(cleanForExcel);

        // Insert tab skips
        const skips = {
            0: 2,  // after ticket
            3: 3,  // after priority
            4: 2,  // after company
            6: 2   // after country
        };

        let finalData = '';
        vals.forEach((v, i) => {
            finalData += v;
            const skipCount = skips[i] || 0;
            finalData += '\t'.repeat(skipCount + 1); // +1 is the usual tab to next cell
        });

        // if FTS is checked, continue from Country skip
        if (isFTSChecked) {
            finalData += '\t'.repeat(1); // follow country skip
        }

        navigator.clipboard.writeText(finalData.trim()).then(() => {
            alert("✅ Data copied! Now, Paste directly into Excel.");
            hideLoadstatModal();
            window.open(SHAREPOINT_LINK, '_blank');
        }).catch(() => {
            alert("⚠️ Copy failed. Please copy manually:\n\n" + finalData);
            hideLoadstatModal();
        });
    });

    $('#closeLoadstat, #loadstatBackdrop').on('click', hideLoadstatModal);

    function addLoadstatButton() {
        const escalateBtn = $('#escalateButton');
        if (escalateBtn.length && !$('#loadstatButton').length) {
            $('<button id="loadstatButton" type="button">Loadstat</button>')
                .insertAfter(escalateBtn)
                .on('click', showLoadstatModal);
        }
    }

    addLoadstatButton();
    new MutationObserver(addLoadstatButton).observe(document.body, { childList: true, subtree: true });

    function fetchCustomerInfo(callback) {
        const customerTab = document.getElementById("ctl00_MainContent_LB_CustomerInfo");
        if (!customerTab) {
            alert("❌ Customer tab not found on this page.");
            callback();
            return;
        }
        customerTab.click();
        setTimeout(() => {
            const checkInterval = 500;
            const maxWaitTime = 8000;
            let elapsed = 0;
            const waitForCustomerInfo = setInterval(() => {
                const c = document.getElementById("ctl00_MainContent_UC_CustomerInfo_L_CompanyValue");
                const n = document.getElementById("ctl00_MainContent_UC_CustomerInfo_L_CountryValue");
                const m = document.getElementById("GM_modelName");
                if (c && c.innerText.trim() !== "") {
                    clearInterval(waitForCustomerInfo);
                    $('#loadstatCompanyName').val(c.innerText.trim());
                    if (n) $('#loadstatCountry').val(n.innerText.trim());
                    if (m) $('#loadstatModel').val(m.innerText.trim().replace(/^→\s*/, ''));
                    callback();
                } else if (elapsed >= maxWaitTime) {
                    clearInterval(waitForCustomerInfo);
                    alert("❌ Customer information not found after waiting.");
                    callback();
                } else elapsed += checkInterval;
            }, checkInterval);
        }, 300);
    }

});
