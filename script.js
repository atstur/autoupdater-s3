document.addEventListener('DOMContentLoaded', () => {
  const CSV_URL = '/data.csv';

  const grid = document.getElementById('products-grid');
  const logoContainer = document.getElementById('logo-container');
  const contactsContainer = document.getElementById('contacts-container');
  const mapSection = document.getElementById('map-section');
  const mapAddress = document.getElementById('map-address');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');
  const modalClose = document.getElementById('modal-close');

  // Модальное окно
  function openModal(text) {
    modalContent.textContent = text;
    modalOverlay.style.display = 'flex';
  }
  function closeModal() {
    modalOverlay.style.display = 'none';
  }
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Создание карточки товара
  function createCard(image, title, description, detailText) {
    const card = document.createElement('div');
    card.className = 'card';
    const detailButton = detailText
      ? `<button class="btn btn-detail">Подробнее</button>`
      : '';
    card.innerHTML = `
      <img src="${image}" alt="${title}" class="card-img">
      <div class="card-body">
        <h3>${title}</h3>
        <p>${description}</p>
        <div class="card-actions">
          <button class="btn btn-order" data-target="form">Заказать</button>
          ${detailButton}
        </div>
      </div>
    `;
    if (detailText) {
      card.querySelector('.btn-detail').addEventListener('click', () => {
        openModal(detailText);
      });
    }
    return card;
  }

  // Создание текстового блока
  function createTextBlock(title, description) {
    const block = document.createElement('div');
    block.className = 'text-block';
    if (title) {
      block.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
    } else {
      block.innerHTML = `<p>${description}</p>`;
    }
    return block;
  }

  // Загрузка данных
  fetch(CSV_URL)
    .then(response => response.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          let config = null;

          results.data.forEach(row => {
            const type = row.type?.trim().toLowerCase();

            if (type === 'config' && !config) {
              config = {
                phone: row.phone?.trim() || '',
                email: row.email?.trim() || '',
                logo: row.logo?.trim() || '',
                lat: parseFloat(row.lat),
                lon: parseFloat(row.lon),
                zoom: parseInt(row.zoom) || 15,
                address: row.address?.trim() || ''
              };
            } else if (type === 'product') {
              const image = row.image?.trim();
              const title = row.title?.trim();
              const description = row.description?.trim();
              const detailText = row.detail_text?.trim() || '';
              if (image && title) {
                grid.appendChild(createCard(image, title, description || '', detailText));
              }
            } else if (type === 'text') {
              const title = row.title?.trim() || '';
              const description = row.description?.trim() || '';
              if (description) {
                grid.appendChild(createTextBlock(title, description));
              }
            }
          });

          // Применяем конфигурацию
          if (config) {
            // Логотип
            if (config.logo) {
              logoContainer.innerHTML = `<img src="${config.logo}" alt="logo">`;
            } else {
              logoContainer.innerHTML = `<span class="logo-text">youtools</span>`;
            }

            // Контакты
            let contactsHtml = '';
            if (config.phone) {
              contactsHtml += `<a href="tel:${config.phone.replace(/\s/g, '')}" class="contact-link">📞 ${config.phone}</a>`;
            }
            if (config.email) {
              contactsHtml += `<a href="mailto:${config.email}?subject=Заявка с сайта" class="contact-link">✉️ ${config.email}</a>`;
            }
            contactsContainer.innerHTML = contactsHtml;

            // --- КАРТА ---
            // Всегда показываем адрес, если он есть
            if (config.address) {
              mapSection.style.display = 'block';
              mapAddress.textContent = config.address;
            }

            // Проверяем координаты
            const latValid = !isNaN(config.lat) && isFinite(config.lat);
            const lonValid = !isNaN(config.lon) && isFinite(config.lon);
            const mapContainer = document.getElementById('map');

            if (latValid && lonValid && mapContainer) {
              // Если секция ещё не показана – показываем
              mapSection.style.display = 'block';
              if (!config.address) {
                mapAddress.textContent = `Координаты: ${config.lat}, ${config.lon}`;
              }

              // Инициализируем карту, когда API готов
              function initMap() {
                try {
                  const map = new ymaps.Map('map', {
                    center: [config.lat, config.lon],
                    zoom: config.zoom || 15,
                    controls: ['zoomControl', 'fullscreenControl']
                  });
                  map.geoObjects.add(new ymaps.Placemark([config.lat, config.lon], {
                    balloonContent: config.address || 'youtools'
                  }));
                  console.log('Карта успешно загружена');
                } catch (e) {
                  console.error('Ошибка создания карты:', e);
                  mapAddress.textContent += ' (карта не загрузилась)';
                }
              }

              // Так как скрипт API уже подключен в HTML, просто ждём готовности
              if (window.ymaps) {
                ymaps.ready(initMap);
              } else {
                // На всякий случай, если скрипт ещё не загружен (хотя он в HTML)
                console.warn('ymaps не найден, возможно скрипт ещё не загружен');
                // Можно подождать или загрузить повторно, но лучше проверить подключение в HTML
              }
            } else {
              if (!latValid || !lonValid) {
                console.warn('Координаты невалидны или отсутствуют:', config.lat, config.lon);
              }
            }
          }

          // Привязываем кнопки "Заказать"
          document.querySelectorAll('.btn-order[data-target="form"]').forEach(btn => {
            btn.addEventListener('click', () => {
              document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
            });
          });
        }
      });
    })
    .catch(error => {
      grid.innerHTML = '<p style="text-align:center; color:red;">Ошибка загрузки данных</p>';
      console.error(error);
    });

  // Обновляем год в футере
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
});