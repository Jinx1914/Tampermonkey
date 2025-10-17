// ==UserScript==
// @name         FortiCare Out-of-Region
// @author       Nico Angelo Abanes and Carnil Anthony De Lara
// @namespace    http://userscripts.frval.fortinet-emea.com/
// @version      v1.0
// @description  A button to track out-of-region customers.
// @include      https://forticare.fortinet.com/CustomerSupport/SupportTeam/EditTicket.aspx*
// @include      https://forticare.fortinet.com/CustomerSupport/SupportTeam/BrowseTicket.aspx*
// ==/UserScript==

'use strict';

$(document).ready(function () {

    const SHAREPOINT_LINK = 'https://fortinet.sharepoint.com/sites/APACLoadStat-APACOORHandling/Shared%20Documents/Forms/AllItems.aspx?csf=1&web=1&e=5XI1Sv&CID=0a29f243%2D878d%2D4f3b%2Dba61%2Df6f565e1fe7a&FolderCTID=0x012000408E99028165044593B5666E3A76335F&id=%2Fsites%2FAPACLoadStat%2DAPACOORHandling%2FShared%20Documents%2FAPAC%20OOR%20Handling';

    const engineerData = {
        'Manila': ['Aaron Chu','Aristeo Quilingan','Arnold Dimailig','Constantin Avellano','Denice De Guzman','Elmer Malayan','Franco Dettori Santos','Franklin Terence Conag','Innah Valerie Bituya','Jackquelyn Era','Jezza Paula Hernandez','Jeferson Bernabe','Jeric Añonuevo','John Michael Lim','Jordan Clar','Kristelle Corinne Andawi','Lars Rayson Bollas','Mar Pugahac','Nico Angelo Abanes','Paulo Dela Pena','Pearl Angelica Chavez','Reybin Villaroman','Reynante Aureada','Ricky Tanagras','Ronmar Galvez','Ruther Ivan Bernal','Ryan Jose','Sherman Joseph Pasquil','Stephen Yao'],
        'Kuala Lumpur': ['Adryan You','Ain Nufaisa Ahmad Basri','Alex Tan','Alex Yap','Alwis Syalman','Boon Hau Tey','Chow Chin Hooi','Cusapong Aunon','Dani Arisandy','Elangkajan Krishnan','Gabriel Au Yong','Hakim Hasny','Haochin Lin','Heung Lok Ngan','Ika Raja Ahmad','Jackie Tai','Jaycee Wong','Karr Ven Loh','Kayzie Cheng','Kim Chai Hing','Kok Wai Cheng','Lai Kuan Leong','Muhammad Yassir Amiruddin','Munzir Ribwan','Nur Atirah Mohamad Nassir','Oscar Wee','Pareena Teerasuchai','Paulo Ginete','Qi Xuan Yah','Sarach Sriswadpong','Sassi Veeran','Soonguan Ooi','Teo Seong Seng','Tino Phung','Wisely Yang','Yao Fei Loo','Yeen Duen Lim','Yi Dong','Yvonne Chia'],
        'Sydney': ['Ankit Dhawan','Atul Srivastava','Chirag Sharma','Chris Tan','Danilo Padula','David Imison','Derek Yang','Frank Yuan','George Zhong','Hari Penmetsa','Jia Hoong Kho','Kenny Chen','Manpreet Singh','Mark Ribbans','Nivedha Balasubramanian','Simon Tan','Supem Fernando']
    };

    // --------------------------------------------------------------
    // CSS
    // --------------------------------------------------------------
    const style = `
        #country::-webkit-inner-spin-button,
        #country::-webkit-outer-spin-button,
        #country::-webkit-clear-button,
        #country::-webkit-calendar-picker-indicator {
            display: none !important;
            -webkit-appearance: none;
        }
        #country {
            appearance: none;
            -moz-appearance: textfield;
            background-image: none !important;
        }
        #outOfRegionBackdrop { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:9998; }
        #outOfRegionForm { display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fdfdfd; padding:15px; border-radius:10px; box-shadow:0 8px 25px rgba(0,0,0,0.15); z-index:9999; width:95%; max-width:420px; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-height:95vh; overflow-y:auto; }
        #outOfRegionForm #formTitle { background-color:#28aa45; color:#fff; padding:12px 0; margin:-15px -15px 20px -15px; text-align:center; font-size:20px; font-weight:600; border-radius:10px 10px 0 0; }
        #outOfRegionForm .form-group { margin-bottom:12px; }
        #outOfRegionForm label { display:block; margin-bottom:4px; font-weight:600; font-size:14px; color:#333; }
        #outOfRegionForm input, #outOfRegionForm select { width:100%; padding:8px; box-sizing:border-box; border:1px solid #ddd; border-radius:6px; font-size:14px; background-color:#fff; }
        #outOfRegionForm input:focus, #outOfRegionForm select:focus { border-color:#28a745; outline:none; box-shadow:0 0 0 2px rgba(178,223,219,0.5); background-color:#fff; }
        #outOfRegionForm .button-group { display:flex; margin-top:15px; }
        #outOfRegionForm button { padding:10px 15px; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px; flex:1;}
        #outOfRegionForm #submitData { background-color:#28aa45; color:#fff; margin-right:8px; }
        #outOfRegionForm #closeData { background-color:#dc3545; color:#fff; margin-left:8px; }
        #dataCaptureButton:hover {  background-color: #2ECC71 !important; color: #fff !important; border-color: transparent}
        #outOfRegionWaitPrompt { display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; border:1px solid #dcdcdc; border-radius:8px; padding:20px 30px; box-shadow:0 6px 20px rgba(0,0,0,0.1); z-index:10000; font-size:16px; color:#333; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    `;
    $('head').append(`<style>${style}</style>`);

    // --------------------------------------------------------------
    // Modal HTML
    // --------------------------------------------------------------
    const formHtml = `
        <div id="outOfRegionBackdrop"></div>
        <div id="outOfRegionWaitPrompt">Fetching customer information, please wait...</div>
        <div id="outOfRegionForm">
            <h1 id="formTitle">OUT-OF-REGION FORM</h1>
            <form id="dataForm">
                <div class="form-group"><label for="ticket-number">Ticket Number:</label><input type="text" id="ticket-number" name="ticket-number" required readonly></div>
                <div class="form-group"><label for="ticketType">Ticket Type:</label>
                    <select id="ticketType" name="ticketType" required>
                        <option value="">-- Select --</option>
                        <option>Picked Up Ticket from Queue</option>
                        <option>Inbound Call Only</option>
                        <option>Inbound Call – Owned Ticket</option>
                        <option>Callback Only</option>
                        <option>Callback - Owned Ticket</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="engrTac">Engineer's TAC:</label>
                 <input type="text" id="engrTac" name="engrTac" readonly />

                </div>
                <div class="form-group">
                      <label for="engrName">Engineer's Name:</label>
                      <input type="text" id="engrName" name="engrName" required readonly />
                </div>
                <div class="form-group"><label for="custHomeTAC">Customer's Region:</label>
                    <select id="custHomeTAC" name="custHomeTAC" required>
                        <option value="">-- Select --</option>
                        <option>AMER</option><option>EMEA</option><option>Bangalore</option><option>Kuala Lumpur (KL)</option>
                        <option>Sydney</option><option>Manila</option><option>Bogota</option><option>Lisbon</option>
                    </select>
                </div>
                <div class="form-group"><label for="country">Country:</label><input type="text" id="country" name="country" required maxlength="30" list="countryHistory"></div>
                <datalist id="countryHistory"></datalist>
                <div class="form-group"><label for="date">Date:</label><input type="date" id="date" name="date" required></div>
                <div class="form-group"><label for="startTime">Start Time:</label>
                    <div style="display:flex;">
                        <input type="text" id="startTime" name="startTime" placeholder="HH:MM" required style="width:70%;" />
                        <select id="startAmPm" name="startAmPm" required style="width:30%;"><option>AM</option><option>PM</option></select>
                    </div>
                </div>
                <div class="form-group"><label for="endTime">End Time:</label>
                    <div style="display:flex;">
                        <input type="text" id="endTime" name="endTime" placeholder="HH:MM" required style="width:70%;" />
                        <select id="endAmPm" name="endAmPm" required style="width:30%;"><option>AM</option><option>PM</option></select>
                    </div>
                </div>
                <div class="form-group"><label for="timeSpent">Time Spent (Minutes):</label><input type="number" id="timeSpent" name="timeSpent" required readonly></div>
                <div class="button-group">
                    <button type="submit" id="submitData">Submit</button>
                    <button type="button" id="closeData">Cancel</button>
                </div>
            </form>
        </div>
    `;
    $('body').append(formHtml);

    // --------------------------------------------------------------
    // Auto-fill Engineer Name & TAC (NOT grayed out)
    // --------------------------------------------------------------
    const engineerLabel = $('#ctl00_LabelUserName').text().trim();
    if (engineerLabel) {
        $('#engrName').val(engineerLabel);
        let detectedTAC = '';
        for (const [tac, names] of Object.entries(engineerData)) {
            if (names.includes(engineerLabel)) {
                detectedTAC = tac;
                break;
            }
        }

        if (detectedTAC) {
            $('#engrTac').val(detectedTAC)
            $('#engrTac option').not(`[value="${detectedTAC}"]`).remove();
        }
    }

    // --------------------------------------------------------------
    // Country history
    // --------------------------------------------------------------
    function loadCountryHistory() {
        const saved = JSON.parse(localStorage.getItem('countryHistory') || '[]');
        const datalist = $('#countryHistory');
        datalist.empty();
        saved.forEach(c => datalist.append(`<option value="${c}">`));
    }
    function saveCountryHistory(val) {
        let saved = JSON.parse(localStorage.getItem('countryHistory') || '[]');
        if(val && !saved.includes(val)) {
            saved.unshift(val);
            if(saved.length > 30) saved = saved.slice(0,30);
            localStorage.setItem('countryHistory', JSON.stringify(saved));
        }
    }
    loadCountryHistory();

    // --------------------------------------------------------------
    // Time calculations
    // --------------------------------------------------------------
    function formatTime(v) {
        v=v.replace(/[^0-9]/g,'').slice(0,4);
        let h=0,m=0;
        if(v.length<=2){h=parseInt(v)||0;}
        else if(v.length===3){h=parseInt(v[0]); m=parseInt(v.slice(1));}
        else {h=parseInt(v.slice(0,2)); m=parseInt(v.slice(2));}
        if(h>12||m>59) return '';
        return h.toString().padStart(2,'0')+':'+m.toString().padStart(2,'0');
    }
    function calcTimeSpent() {
        const s=$('#startTime').val(), sa=$('#startAmPm').val(), e=$('#endTime').val(), ea=$('#endAmPm').val();
        if(!s||!e) return;
        const parse=(t,a)=>{let[h,m]=t.split(':').map(Number); if(a==='PM'&&h!==12)h+=12; if(a==='AM'&&h===12)h=0; return h*60+m;};
        let diff=parse(e,ea)-parse(s,sa); if(diff<0) diff+=1440;
        $('#timeSpent').val(diff);
    }
    $('#startTime,#endTime').on('blur keyup',function(e){
        if(e.type==='blur' || e.key==='Enter'){
            $(this).val(formatTime($(this).val())); calcTimeSpent();
        }
    });
    $('#startAmPm,#endAmPm').on('change', calcTimeSpent);

    // --------------------------------------------------------------
    // Submission logic
    // --------------------------------------------------------------
    function showModal() {
        const fullText = $('#ctl00_MainContent_UC_NotePadMessage_L_TicketId').text();
        const ticketNumberMatch = fullText.match(/\b\d{8}\b/);
        const ticketNumber = ticketNumberMatch ? ticketNumberMatch[0] : '';

        $('#ticket-number').val(ticketNumber);
        loadCountryHistory();
        $('#outOfRegionBackdrop').fadeIn();
        $('#outOfRegionWaitPrompt').fadeIn(150);

        fetchCustomerInfoOut(() => {
            $('#outOfRegionWaitPrompt').fadeOut(150, function () {
                $('#outOfRegionForm').fadeIn();
            });
        });
    }
    function hideModal() {
        $('#outOfRegionBackdrop').fadeOut();
        $('#outOfRegionForm').fadeOut();
        $('#dataForm')[0].reset();
        $('#timeSpent').val('');
    }
    $('#dataForm').on('submit', function(e){
        e.preventDefault();
        const vals = [
            $('#ticket-number').val(),
            $('#ticketType').val(),
            $('#engrTac').val(),
            $('#engrName').val(),
            $('#custHomeTAC').val(),
            $('#country').val(),
            $('#date').val(),
            $('#startTime').val()+' '+$('#startAmPm').val(),
            $('#endTime').val()+' '+$('#endAmPm').val(),
            $('#timeSpent').val()
        ];
        saveCountryHistory($('#country').val());
        const final = vals.join('\t');
        navigator.clipboard.writeText(final).then(()=>{
            setTimeout(()=>{
                alert("Data copied! Please paste the copied data into today’s Excel form.");
                hideModal(); window.open(SHAREPOINT_LINK,'_blank');
                if(typeof __doPostBack==='function'){ __doPostBack('ctl00$MainContent$LB_Submit',''); }
                else { $('#ctl00_MainContent_LB_Submit').click(); }
            },50);
        }).catch(()=>{
            alert("⚠️ Copy failed. Please copy manually:\n\n"+final);
            hideModal();
            if(typeof __doPostBack==='function'){ __doPostBack('ctl00$MainContent$LB_Submit',''); }
            else { $('#ctl00_MainContent_LB_Submit').click(); }
        });
    });

    $('#country').on('input', function() {
        let v = $(this).val().replace(/[^a-zA-Z\s]/g,'').slice(0,30);
        $(this).val(v);
    });

    // --------------------------------------------------------------
    // Button event handlers
    // --------------------------------------------------------------
    $(document).on('click','#dataCaptureButton', showModal);
    $('#closeData').on('click', function() {
       hideModal();
       location.reload();
    });

    $('#outOfRegionBackdrop').on('click', hideModal);

    const addDataCaptureButton=()=> {
        const label=$('#ctl00_MainContent_UC_AddComment_L_comment');
        if(label.length && $('#dataCaptureButton').length===0){
            label.prepend('<button id="dataCaptureButton" type="button" style="margin:5px;">Out-of-Region</button>');
        }
    };
    addDataCaptureButton();
    new MutationObserver(addDataCaptureButton).observe(document.body,{childList:true,subtree:true});

    // --------------------------------------------------------------
    // Fetch customer info logic
    // --------------------------------------------------------------
    function fetchCustomerInfoOut(callback) {
        const customerTab = document.getElementById("ctl00_MainContent_LB_CustomerInfo");
        if (!customerTab) { callback(); return; }
        customerTab.click();

        setTimeout(() => {
            const checkInterval = 500;
            const maxWaitTime = 8000;
            let elapsed = 0;
            const waitForCustomerInfo = setInterval(() => {
                const countryEl = document.getElementById("ctl00_MainContent_UC_CustomerInfo_L_CountryValue");
                const companyEl = document.getElementById("ctl00_MainContent_UC_CustomerInfo_L_CompanyValue");
                if (companyEl && companyEl.innerText.trim() !== "") {
                    clearInterval(waitForCustomerInfo);
                    if (countryEl) {
                        const countryText = countryEl.innerText.trim();
                        if (countryText) $('#country').val(countryText);
                    }
                    callback();
                } else if (elapsed >= maxWaitTime) {
                    clearInterval(waitForCustomerInfo);
                    callback();
                } else elapsed += checkInterval;
            }, checkInterval);
        }, 300);
    }

});
