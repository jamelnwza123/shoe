// ==========================================
// SOLESTEP - Main JavaScript File
// ==========================================

// ------------------------------------------
// ตั้งค่า Telegram Bot
// ------------------------------------------
const TELEGRAM_BOT_TOKEN = '8727544403:AAG9TIR9D9KhKIoHJNEo8zOtI_6xY8y8enY';
const TELEGRAM_CHAT_ID = '@jame125';
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitButton = orderForm.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = 'กำลังส่งข้อมูล...';
      }

      const payload = {
        customerName: customerNameInput ? customerNameInput.value.trim() : '',
        contact: contactInput ? contactInput.value.trim() : '',
        items: itemsInput ? itemsInput.value.trim() : '',
        total: totalInput ? totalInput.value.trim() : '',
        note: noteInput ? noteInput.value.trim() : '',
        timestamp: new Date().toISOString()
      };

      const scriptUrl = 'https://script.google.com/macros/s/AKfycbxnmi8_pslLiyW4Tsim6qLnb1QL8U4UH8w98waCMyQItpjeaSAYXvuvXL9EoDE7FhSo/exec';

      // ----------------------------------------------------
      // สร้าง Payload และข้อความสำหรับแจ้งเตือนเข้า Telegram
      // ----------------------------------------------------
      const telegramMessage = `👟 <b>มีคำสั่งซื้อใหม่! (SOLESTEP)</b>\n\n` +
                              `👤 <b>ชื่อลูกค้า:</b> ${payload.customerName}\n` +
                              `📞 <b>ติดต่อ:</b> ${payload.contact}\n` +
                              `🛍️ <b>สินค้า:</b> ${payload.items}\n` +
                              `💰 <b>ยอดรวม:</b> ฿${payload.total}\n` +
                              `📝 <b>หมายเหตุ:</b> ${payload.note || '-'}`;

      const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const telegramPayload = {
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramMessage,
        parse_mode: 'HTML'
      };

      // ใช้ Promise.all เพื่อยิงข้อมูลไปที่ Google Sheets และ Telegram พร้อมๆ กัน
      Promise.all([
        fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors', // standard for Google Apps Script web app endpoint cross-origin submissions
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }),
        fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telegramPayload)
        })
      ])
      .then(() => {
        alert('บันทึกการสั่งซื้อเรียบร้อยแล้ว! ขอบคุณที่ไว้วางใจ SOLESTEP');
        orderForm.reset();
        window.location.href = 'product.html'; // หากมีหน้า thankyou.html แนะนำให้เปลี่ยนให้ไปหน้านั้นแทน
      })
      .catch(error => {
        console.error('Error submitting order:', error);
        alert('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerText = 'ยืนยันสั่งซื้อ';
        }
      });
    });
  }
}

// ------------------------------------------
// 5. ADMIN PAGE (admin.html)
// ------------------------------------------
function initAdminPage() {
  const ordersTable = document.getElementById('ordersTable');
  if (!ordersTable) return;

  // แนะนำให้แก้ไขลิงก์ลงท้ายจาก /pubhtml เป็น /pub?output=csv เพื่อให้ดึงข้อมูล CSV ได้ถูกต้อง
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRCWvwRxVIJWdG2QO7mQD-fBDzQ6l4AfhdYzGGmCIBw-78UrYpUUE3WHMPWtNSoKuiEWM9Q-neonNWi/pub?output=csv';


  fetch(csvUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to fetch CSV data');
      }
      return response.text();
    })
    .then(csvText => {
      const rows = parseCSV(csvText);
      renderTable(rows);
    })
    .catch(error => {
      console.error('Error loading admin orders:', error);
      ordersTable.innerHTML = '<tbody><tr><td colspan="10" style="text-align:center; color:red;">ไม่สามารถโหลดข้อมูลรายการสั่งซื้อได้</td></tr></tbody>';
    });

  // Helper function to parse CSV safely (handling quotes & commas)
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
     
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  }

  // Render parsed CSV rows into #ordersTable HTML
  function renderTable(rows) {
    if (rows.length === 0) {
      ordersTable.innerHTML = '<tbody><tr><td style="text-align:center;">ไม่มีข้อมูลสั่งซื้อ</td></tr></tbody>';
      return;
    }

    const headerRow = rows[0];
    const dataRows = rows.slice(1);
   
    // เรียงให้รายการล่าสุดขึ้นก่อน (Optional)
    dataRows.reverse();


    let html = '<thead><tr>';
    headerRow.forEach(header => {
      html += `<th>${escapeHtml(header)}</th>`;
    });
    html += '</tr></thead><tbody>';

    if (dataRows.length === 0 || (dataRows.length === 1 && dataRows[0].join('') === '')) {
      html += `<tr><td colspan="${headerRow.length}" style="text-align:center;">ยังไม่มีรายการสั่งซื้อเข้ามา</td></tr>`;
    } else {
      dataRows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
          html += `<td>${escapeHtml(cell)}</td>`;
        });
        html += '</tr>';
      });
    }

    html += '</tbody>';
    ordersTable.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
