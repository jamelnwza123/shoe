// ==========================================
// SOLESTEP - Main JavaScript File
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Determine current page based on element existence
  if (document.getElementById('product-list')) {
    initProductPage();
  }
  
  if (document.getElementById('orderForm')) {
    initOrderPage();
  }
  
  if (document.getElementById('ordersTable')) {
    initAdminPage();
  }
});

// ------------------------------------------
// 1. PRODUCT PAGE (product.html)
// ------------------------------------------
function initProductPage() {
  const productList = document.getElementById('product-list');
  const filterBar = document.getElementById('filter-bar');
  let allProducts = [];

  // Fetch products from products.json
  fetch('products.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      allProducts = data;
      renderFilterBar();
      renderProducts(allProducts);
    })
    .catch(error => {
      console.error('Error loading products:', error);
      productList.innerHTML = '<p class="error-message">ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง</p>';
    });

  // Render Filter Buttons dynamically
  function renderFilterBar() {
    if (!filterBar) return;
    
    const categories = [
      { id: 'all', name: 'ทั้งหมด' },
      { id: 'urban', name: 'Urban' },
      { id: 'trail', name: 'Trail' },
      { id: 'care', name: 'Care' }
    ];

    filterBar.innerHTML = categories.map(cat => `
      <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}" data-filter="${cat.id}">
        ${cat.name}
      </button>
    `).join('');

    // Event listener for filtering
    filterBar.addEventListener('click', (e) => {
      if (!e.target.classList.contains('filter-btn')) return;

      // Toggle active class
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');

      const filterValue = e.target.getAttribute('data-filter');
      if (filterValue === 'all') {
        renderProducts(allProducts);
      } else {
        const filtered = allProducts.filter(item => item.mood && item.mood.toLowerCase() === filterValue.toLowerCase());
        renderProducts(filtered);
      }
    });
  }

  // Render Product Cards to #product-list
  function renderProducts(products) {
    if (!productList) return;

    if (products.length === 0) {
      productList.innerHTML = '<p class="no-products">ไม่พบสินค้าในหมวดหมู่นี้</p>';
      return;
    }

    productList.innerHTML = products.map(product => {
      // 2. URL parameter redirection for purchasing
      const orderUrl = `order.html?item=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price)}`;
      
      return `
        <div class="product-card">
          <div class="card-image-wrapper">
            <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=SOLESTEP'">
            <span class="mood-badge ${product.mood ? product.mood.toLowerCase() : ''}">${product.mood || 'SOLES'}</span>
          </div>
          <div class="card-body">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description || ''}</p>
            <div class="card-footer">
              <span class="product-price">฿${Number(product.price).toLocaleString()}</span>
              <a href="${orderUrl}" class="btn-add-cart">สั่งซื้อ</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ------------------------------------------
// 2. & 3. & 4. ORDER PAGE (order.html)
// ------------------------------------------
function initOrderPage() {
  const orderForm = document.getElementById('orderForm');
  const customerNameInput = document.getElementById('customerName');
  const contactInput = document.getElementById('contact');
  const itemsInput = document.getElementById('items');
  const totalInput = document.getElementById('total');
  const noteInput = document.getElementById('note');

  // 3. Read URL Parameters and Auto-fill #items and #total
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get('item');
  const priceParam = urlParams.get('price');

  if (itemsInput && itemParam) {
    itemsInput.value = itemParam;
  }
  if (totalInput && priceParam) {
    totalInput.value = priceParam;
  }

  // 4. Handle Order Submission (POST JSON to Google Apps Script)
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

      const scriptUrl = 'https://script.google.com/macros/s/AKfycbyPSEvTYLhlqV0_FwgAjIffIsB12DX5WErXGFBO3nZy_vLG4_IttML1zYnrplUYH9Re/exec';

      // Send POST request
      fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', // standard for Google Apps Script web app endpoint cross-origin submissions
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(() => {
        alert('บันทึกการสั่งซื้อเรียบร้อยแล้ว! ขอบคุณที่ไว้วางใจ SOLESTEP');
        orderForm.reset();
        window.location.href = 'product.html';
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

  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRCWvwRxVIJWdG2QO7mQD-fBDzQ6l4AfhdYzGGmCIBw-78UrYpUUE3WHMPWtNSoKuiEWM9Q-neonNWi/pub?gid=0&single=true&output=csv';

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
