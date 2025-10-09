// ==UserScript==
// @name           FortiCare Escalation
// @author         Nico Angelo Abanes and Carnil Anthony De Lara
// @namespace      http://userscripts.frval.fortinet-emea.com/
// @version        v1.0
// @description    Adds [SE]/[DM] to ticket title, triggers ticket submit, opens SharePoint, shows banner only for escalated tickets.
// @grant          none
// @include        https://forticare.fortinet.com/CustomerSupport/SupportTeam/EditTicket.aspx*
// @include        https://forticare.fortinet.com/CustomerSupport/SupportTeam/BrowseTicket.aspx*
// @updateURL      https://raw.githubusercontent.com/Jinx1914/Fortinet-Tampermonkey/main/Forticare%20Escalation%20(No%20Internal%20Notes).js
// @downloadURL    https://raw.githubusercontent.com/Jinx1914/Fortinet-Tampermonkey/main/Forticare%20Escalation%20(No%20Internal%20Notes).js
// ==/UserScript==

$(document).ready(function () {
  /** ---------- CSS ---------- */
  if ($('#escalateFormStyles').length === 0) {
    const style = document.createElement('style');
    style.id = 'escalateFormStyles';
    style.textContent = `
      #escalateBackdrop { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.45); z-index: 9998; }
      #escalateForm { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); background: #fff; padding: 30px; border-radius: 14px; width: 420px; max-width: 95%; box-shadow: 0 10px 35px rgba(0,0,0,0.25); z-index: 9999; font-family: 'Segoe UI', sans-serif; }
      #escalationFormTitle { font-size: 32px; font-weight: 800; margin-bottom: 25px; text-align: center; color: #2c3e50; letter-spacing: 1px; }
      #closeEscalation { position: absolute; top: 14px; right: 18px; background: transparent; border: none; font-size: 28px; line-height: 1; cursor: pointer; color: #999; }
      #closeEscalation:hover { color: #dc3545; }
      #escalateForm label { display: block; margin-top: 10px; margin-bottom: 4px; font-weight: 600; color: #444; font-size: 14px; }
      #escalateForm input, #escalateForm select, #escalateForm textarea { width: 100%; padding: 10px; margin-bottom: 12px; border-radius: 8px; border: 1px solid #ccc; font-size: 14px; box-sizing: border-box; background: #f9f9f9; }
      #escalateForm input:focus, #escalateForm select:focus, #escalateForm textarea:focus { border-color: #28a745; outline: none; box-shadow: 0 0 0 3px rgba(40,167,69,0.1); }
      #escalateForm textarea { resize: vertical; min-height: 80px; max-height: 200px; }
      #submitEscalation { background: #28a745; color: #fff; font-weight: bold; padding: 10px 16px; border-radius: 8px; border: none; width: 100%; margin-top: 10px; cursor: pointer; font-size: 15px; transition: background 0.2s; }
      #submitEscalation:hover { background: #218838; }
      .escalate-invalid { border-color: red !important; background: #ffe6e6; }
      #escalateButton:hover { background-color: #2ECC71 !important; color: #fff !important; border-color: transparent;}
      #escalateButton {margin: 4px;}

      /* Banner styles (bottom-center) */
      #escalationBanner { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #FF5722; color: #fff; padding: 16px 20px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); font-family: 'Segoe UI', sans-serif; max-width: 350px; min-width: 250px; display: flex; flex-direction: column; gap: 4px; word-wrap: break-word; white-space: normal; z-index: 10000; font-size: 14px; line-height: 1.4; max-height: 70vh; overflow-y: auto; }
      #closeEscalationBanner { position: absolute; top: 10px; right: 12px; background: transparent; border: none; color: #fff; font-size: 20px; cursor: pointer; line-height: 1; }
      #closeEscalationBanner:hover { color: #ffc107; }
      .banner-title { font-weight: 800; font-size: 15px; margin-bottom: 6px; padding-right: 30px; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
      .banner-line { margin-bottom: 3px; line-height: 1.3em; }

      /* Show Banner Button */
      #showEscalationBanner { display: none; position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #FF5722; color: #fff; border: none; padding: 10px 14px; border-radius: 6px; cursor: pointer; z-index: 10001; font-size: 13px; box-shadow: 0 3px 10px rgba(0,0,0,0.2); }
      #showEscalationBanner:hover { background: #E64A19; }
    `;
    document.head.appendChild(style);
  }

  /** ---------- HTML ---------- */
  if ($('#escalateBackdrop').length === 0) $('body').append('<div id="escalateBackdrop"></div>');
  if ($('#escalateForm').length === 0) {
    const formHtml = `
      <div id="escalateForm">
        <button id="closeEscalation" type="button">&times;</button>
        <h1 id="escalationFormTitle">Escalation Form</h1>
        <label for="escalateDate">Date Escalated:</label>
        <input type="date" id="escalateDate" required>
        <label for="escalatedBy">Escalated By:</label>
        <input type="text" id="escalatedBy" placeholder="Full Name" required>
        <label for="classification">Classification:</label>
        <select id="classification" required>
          <option value="">-- Select Classification --</option>
          <option>Duty Manager Escalated</option>
          <option>Sales Escalated</option>
        </select>
        <label for="escalationReason">Escalation Reason:</label>
        <select id="escalationReason" required>
          <option value="">-- Select Reason --</option>
          <option>Time-Sensitive</option>
          <option>Lack of Engineering Skills</option>
          <option>Communication</option>
          <option>Extended Delay</option>
          <option>Important Customer</option>
        </select>
        <label for="escalateComment">Comment:</label>
        <textarea id="escalateComment" placeholder="Enter comments" required></textarea>
        <button id="submitEscalation" type="button">SUBMIT</button>
      </div>
    `;
    $('body').append(formHtml);
  }
  if ($('#showEscalationBanner').length === 0) $('body').append('<button id="showEscalationBanner">⚠️ ESCALATION DETAILS</button>');

  /** ---------- Ensure Escalate Button Injection ---------- */
  function insertEscalateButton() {
    if ($('#escalateButton').length === 0 && $('#dataCaptureButton').length > 0) {
      $('<button id="escalateButton" type="button" style="margin-left:10px;">Escalate</button>')
        .insertAfter('#dataCaptureButton');
    }
  }

  // Run immediately, then retry every 1s until found
  insertEscalateButton();
  const buttonInterval = setInterval(() => {
    insertEscalateButton();
    if ($('#escalateButton').length > 0) clearInterval(buttonInterval);
  }, 1000);

  // Also observe DOM changes
  const observer = new MutationObserver(insertEscalateButton);
  observer.observe(document.body, { childList: true, subtree: true });

  /** ---------- JS Logic ---------- */
  const backdropEl = $('#escalateBackdrop');
  const formEl = $('#escalateForm');
  const showBtn = $('#showEscalationBanner');

  function showModal() { backdropEl.show(); formEl.show(); }
  function hideModal() { backdropEl.hide(); formEl.hide(); }

  $('body').on('click', '#escalateButton', showModal);
  $('#closeEscalation').on('click', hideModal);
  backdropEl.on('click', hideModal);
  $(document).on('keydown', e => { if (e.key === 'Escape') hideModal(); });

  // Check ticket title for [SE] or [DM] to show banner
  const ticketTitleFieldVal = $('input[name="ctl00$MainContent$TB_TicketTitle"]').val() || '';
  if (ticketTitleFieldVal.includes('[SE]') || ticketTitleFieldVal.includes('[DM]')) {
      const savedBanner = sessionStorage.getItem('escalationBanner');
      if (savedBanner) {
          $('body').append(savedBanner);
          const hidden = sessionStorage.getItem('escalationBannerHidden') === 'true';
          if (hidden) $('#escalationBanner').hide(), showBtn.show();
          $('#closeEscalationBanner').on('click', () => { $('#escalationBanner').hide(); showBtn.show(); sessionStorage.setItem('escalationBannerHidden','true'); });
      }
  }

  showBtn.on('click', () => { $('#escalationBanner').show(); showBtn.hide(); sessionStorage.setItem('escalationBannerHidden','false'); });

  $('#submitEscalation').on('click', () => {
    const fields = formEl.find('input[required], select[required], textarea[required]');
    fields.removeClass('escalate-invalid');
    let valid = true;
    fields.each(function () { if (!$(this).val().trim()) { $(this).addClass('escalate-invalid'); valid = false; } });
    if (!valid) { alert('Please fill out all required fields.'); return; }

    // Add [SE]/[DM] prefix to ticket title
    const ticketTitleField = $('input[name="ctl00$MainContent$TB_TicketTitle"]');
    const classification = $('#classification').val();
    if (ticketTitleField.length > 0) {
      let prefix = '';
      if (classification === 'Duty Manager Escalated') prefix = '[DM] ';
      else if (classification === 'Sales Escalated') prefix = '[SE] ';
      ticketTitleField.val(ticketTitleField.val().replace(/^\[(SE|DM)\]\s*/, ''));
      ticketTitleField.val(prefix + ticketTitleField.val());
    }

    const comment = $('#escalateComment').val();
    $('#escalateComment').val('');

    if (!confirm('You are about to submit the form and open the Project Management SharePoint. Would you like to proceed?')) return;

    // show banner
    const date = $('#escalateDate').val();
    const escalatedBy = $('#escalatedBy').val();
    const reason = $('#escalationReason').val();
    const bannerHtml = `
      <div id="escalationBanner">
        <button id="closeEscalationBanner">&times;</button>
        <div class="banner-title">⚠️ ESCALATION DETAILS</div>
        <div class="banner-line"><strong>Date Escalated:</strong> ${date}</div>
        <div class="banner-line"><strong>Escalated By:</strong> ${escalatedBy}</div>
        <div class="banner-line"><strong>Classification:</strong> ${classification}</div>
        <div class="banner-line"><strong>Reason:</strong> ${reason}</div>
        <div class="banner-line"><strong>Comment:</strong> ${comment}</div>
      </div>
    `;
    $('#escalationBanner').remove();
    $('body').append(bannerHtml);
    sessionStorage.setItem('escalationBanner', bannerHtml);
    sessionStorage.setItem('escalationBannerHidden', 'false');
    $('#closeEscalationBanner').on('click', () => { $('#escalationBanner').hide(); showBtn.show(); sessionStorage.setItem('escalationBannerHidden','true'); });

    // open SharePoint
    window.open('https://fortinet.sharepoint.com/sites/APACAS/_layouts/15/listforms.aspx?cid=MGExYjU5Y2EtOTE3MS00YzIyLWIwOTktOGJhZTM5MTkxNDdk&nav=YTgyMzkyZgt-Mjk4Yi00OGNhLThlOGMtZTkwMTBiZjU3MTk3','_blank');

    // trigger ticket submit
    if ($('#ctl00_MainContent_LB_Submit').length > 0) {
      __doPostBack('ctl00$MainContent$LB_Submit','');
    }
  });
});

