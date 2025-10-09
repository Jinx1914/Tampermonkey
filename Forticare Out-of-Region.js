// ==UserScript==
// @name         FortiCare Out-of-Region
// @author       Nico Angelo Abanes and Carnil Anthony De Lara
// @namespace    http://userscripts.frval.fortinet-emea.com/
// @version      v1.0
// @description  A button to track out-of-region customers
// @grant        none
// @include      https://forticare.fortinet.com/CustomerSupport/SupportTeam/EditTicket.aspx*
// @include      https://forticare.fortinet.com/CustomerSupport/SupportTeam/BrowseTicket.aspx*
// @updateURL    https://raw.githubusercontent.com/Jinx1914/Tampermonkey/refs/heads/main/Forticare%20Out-of-Region.js
// @downloadURL  https://raw.githubusercontent.com/Jinx1914/Tampermonkey/refs/heads/main/Forticare%20Out-of-Region.js
// ==/UserScript==

'use strict';

$(document).ready(function () {

    const SHAREPOINT_LINK = 'https://fortinet.sharepoint.com/sites/APACLoadStat-APACOORHandling/Shared%20Documents/Forms/AllItems.aspx?csf=1&web=1&e=5XI1Sv&CID=0a29f243%2D878d%2D4f3b%2Dba61%2Df6f565e1fe7a&FolderCTID=0x012000408E99028165044593B5666E3A76335F&id=%2Fsites%2FAPACLoadStat%2DAPACOORHandling%2FShared%20Documents%2FAPAC%20OOR%20Handling';

    const engineerData = {
        'Manila': ['Aaron Chu','Aristeo Quilingan','Arnold Dimailig','Constantin Avellano','Denice De Guzman','Elmer Malayan',
            'Franco Dettori Santos','Franklin Terence Conag','Innah Valerie Bituya','Jackquelyn Era','Jezza Paula Hernandez',
            'Jeferson Bernabe','Jeric Añonuevo','John Michael Lim','Jordan Clar','Kristelle Corinne Andawi','Lars Rayson Bollas',
            'Mar Pugahac','Nico Angelo Abanes','Paulo Dela Pena','Pearl Angelica Chavez','Reybin Villaroman','Reynante Aureada',
            'Ricky Tanagras','Ronmar Galvez','Ruther Ivan Bernal','Ryan Jose','Sherman Joseph Pasquil','Stephen Yao'],
        'Kuala Lumpur': ['Adryan You','Ain Nufaisa Ahmad Basri','Alex Tan','Alex Yap','Alwis Syalman','Boon Hau Tey','Chow Chin Hooi',
            'Cusapong Aunon','Dani Arisandy','Elangkajan Krishnan','Gabriel Au Yong','Hakim Hasny','Haochin Lin','Heung Lok Ngan',
            'Ika Raja Ahmad','Jackie Tai','Jaycee Wong','Karr Ven Loh','Kayzie Cheng','Kim Chai Hing','Kok Wai Cheng','Lai Kuan Leong',
            'Muhammad Yassir Amiruddin','Munzir Ribwan','Nur Atirah Mohamad Nassir','Oscar Wee','Pareena Teerasuchai','Paulo Ginete',
            'Qi Xuan Yah','Sarach Sriswadpong','Sassi Veeran','Soonguan Ooi','Teo Seong Seng','Tino Phung','Wisely Yang','Yao Fei Loo',
            'Yeen Duen Lim','Yi Dong','Yvonne Chia'],
        'Sydney': ['Ankit Dhawan','Atul Srivastava','Chirag Sharma','Chris Tan','Danilo Padula','David Imison','Derek Yang','Frank Yuan',
            'George Zhong','Hari Penmetsa','Jia Hoong Kho','Kenny Chen','Manpreet Singh','Mark Ribbans','Nivedha Balasubramanian',
            'Simon Tan','Supem Fernando']
    };

    // --------------------------------------------------------------
    // CSS
    // --------------------------------------------------------------
    const style = `
        #dataCaptureBackdrop { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:9998; }
        #dataCaptureForm { display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fdfdfd; padding:15px; border-radius:10px; box-shadow:0 8px 25px rgba(0,0,0,0.15); z-index:9999; width:95%; max-width:420px; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-height:95vh; overflow-y:auto; }
        #formTitle { background-color:#28aa45; color:#fff; padding:12px 0; margin:-15px -15px 20px -15px; text-align:center; font-size:20px; font-weight:600; border-radius:10px 10px 0 0; }
        #dataCaptureForm .form-group { margin-bottom:12px; }
        #dataCaptureForm label { display:block; margin-bottom:4px; font-weight:600; font-size:14px; color:#333; }
        #dataCaptureForm input, #dataCaptureForm select { width:100%; padding:8px; box-sizing:border-box; border:1px solid #ddd; border-radius:6px; font-size:14px; background-color:#fff; }
        #dataCaptureForm .button-group { display:flex; margin-top:15px; }
        #dataCaptureForm button { padding:10px 15px; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px; flex:1;}
        #dataCaptureForm #submitData { background-color:#28aa45; color:#fff; margin-right:8px; }
        #dataCaptureForm #closeData { background-color:#dc3545; color:#fff; margin-left:8px; }
        #dataCaptureButton:hover {  background-color: #2ECC71 !important; color: #fff !important; border-color: transparent}

        /* Remove dropdown arrow from Country field */
        #country::-webkit-calendar-picker-indicator,
        #country::-webkit-inner-spin-button,
        #country::-webkit-outer-spin-button,
        #country::-webkit-clear-button {
            display: none !important;
            -webkit-appearance: none !important;
        }
    `;
    $('head').append(`<style>${style}</style>`);

    // --------------------------------------------------------------
    // Modal HTML
    // --------------------------------------------------------------
    const formHtml = `
        <div id="dataCaptureBackdrop"></div>
        <div id="dataCaptureForm">
            <h1 id="formTitle">OUT-OF-REGION FORM</h1>
            <form id="dataForm">
                <div class="form-group"><label for="ticket-number">Ticket Number:</label><input type="text" id="ticket-number" name="ticket-number" required readonly></div>
                <div class="form-group"><label for="ticketType">Ticket Type:</label>
                    <select id="ticketType" name="ticketType" required>
                        <option value="">-- Select --</option>
                        <option>Inbound Call Only</option>
                        <option>Inbound Call – Owned Ticket</option>
                        <option>Picked Up Ticket from Queue</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="engrTac">Engineer's TAC:</label>
                    <select id="engrTac" name="engrTac" required>
                        <option value="">-- Select TAC --</option>
                        <option value="Manila">Manila</option>
                        <option value="Kuala Lumpur">Kuala Lumpur</option>
                        <option value="Sydney">Sydney</option>
                    </select>
                </div>
                <div class="form-group"><label for="engrName">Engineer's Name:</label><select id="engrNameDropdown" name="engrNameDropdown" required><option value="">-- Select Engineer --</option></select></div>
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

    const backdrop = $('#dataCaptureBackdrop');
    const formModal = $('#dataCaptureForm');

    // --------------------------------------------------------------
    // Country history (max 30)
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
    // Utility functions
    // --------------------------------------------------------------
    function showModal() {
        const fullText = $('#ctl00_MainContent_UC_NotePadMessage_L_TicketId').text();
        const ticketNumber = fullText.replace('Ticket Number:','').replace('(refresh)','').trim();
        $('#ticket-number').val(ticketNumber);
        loadCountryHistory();
        backdrop.fadeIn(); formModal.fadeIn();
    }
    function hideModal() {
        backdrop.fadeOut(); formModal.fadeOut();
        $('#dataForm')[0].reset(); $('#timeSpent').val('');
        $('#engrNameDropdown').empty().append('<option value="">-- Select Engineer --</option>');
    }
    function populateEngineerDropdown(tac) {
        const dd = $('#engrNameDropdown');
        dd.empty().append('<option value="">-- Select Engineer --</option>');
        if(tac && engineerData[tac]) {
            engineerData[tac].forEach(n => dd.append(`<option value="${n}">${n}</option>`));
        }
    }
    $('#engrTac').on('change', function(){ populateEngineerDropdown($(this).val()); });

    // Prevent numbers/special chars in Country
    $('#country').on('input', function() {
        let v = $(this).val().replace(/[^a-zA-Z\s]/g,'').slice(0,30);
        $(this).val(v);
    });

    // Time formatting
    function formatTime(v) {
        v=v.replace(/[^0-9]/g,'').slice(0,4); let h=0,m=0;
        if(v.length<=2){h=parseInt(v)||0;}
        else if(v.length===3){h=parseInt(v[0]); m=parseInt(v.slice(1));}
        else {h=parseInt(v.slice(0,2)); m=parseInt(v.slice(2));}
        if(h>12||m>59) return ''; return h.toString().padStart(2,'0')+':'+m.toString().padStart(2,'0');
    }
    function calcTimeSpent() {
        const s=$('#startTime').val(), sa=$('#startAmPm').val(), e=$('#endTime').val(), ea=$('#endAmPm').val();
        if(!s||!e) return; const parse=(t,a)=>{let[h,m]=t.split(':').map(Number); if(a==='PM'&&h!==12)h+=12; if(a==='AM'&&h===12)h=0; return h*60+m;};
        let diff=parse(e,ea)-parse(s,sa); if(diff<0) diff+=1440; $('#timeSpent').val(diff);
    }
    $('#startTime,#endTime').on('blur keyup',function(e){if(e.type==='blur'||e.key==='Enter'){ $(this).val(formatTime($(this).val())); calcTimeSpent(); }});
    $('#startAmPm,#endAmPm').on('change', calcTimeSpent);

    // --------------------------------------------------------------
    // Submission
    // --------------------------------------------------------------
    $('#dataForm').on('submit', function(e){
        e.preventDefault();
        const vals = [
            $('#ticket-number').val(),
            $('#ticketType').val(),
            $('#engrTac').val(),
            $('#engrNameDropdown').val(),
            $('#custHomeTAC').val(),
            $('#country').val(),
            $('#date').val(),
            $('#startTime').val()+' '+$('#startAmPm').val(),
            $('#endTime').val()+' '+$('#endAmPm').val(),
            $('#timeSpent').val()
        ];
        saveCountryHistory($('#country').val());
        const final=vals.join('\t');
        navigator.clipboard.writeText(final).then(()=>{
            setTimeout(()=>{
                alert("The ticket will be recorded as internal notes; Kindly paste the copied data into the Excel form dated for today.");
                hideModal(); window.open(SHAREPOINT_LINK,'_blank');
                if(typeof __doPostBack==='function'){__doPostBack('ctl00$MainContent$LB_Submit','');}
                else {$('#ctl00_MainContent_LB_Submit').click();}
            },50);
        }).catch(()=>{
            alert("⚠️ Copy failed. Please copy manually:\n\n"+final);
            hideModal();
            if(typeof __doPostBack==='function'){__doPostBack('ctl00$MainContent$LB_Submit','');}
            else {$('#ctl00_MainContent_LB_Submit').click();}
        });
    });

    // --------------------------------------------------------------
    // Event handlers
    // --------------------------------------------------------------
    $(document).on('click','#dataCaptureButton', showModal);
    $('#closeData').on('click', hideModal);
    $('#dataCaptureBackdrop').on('click', hideModal);

    const addDataCaptureButton=()=> {
        const label=$('#ctl00_MainContent_UC_AddComment_L_comment');
        if(label.length && $('#dataCaptureButton').length===0){
            label.prepend('<button id="dataCaptureButton" type="button" style="margin-left:5px;">Out-of-Region</button>');
        }
    };
    addDataCaptureButton();
    new MutationObserver(addDataCaptureButton).observe(document.body,{childList:true,subtree:true});
});

