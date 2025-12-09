document.addEventListener('DOMContentLoaded', () => {
    console.log('Jirani Airbnb loaded');

    // Sticky header shadow
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 0) {
                header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
            } else {
                header.style.boxShadow = 'none';
            }
        });
    }

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle && header) {
        menuToggle.addEventListener('click', () => {
            header.classList.toggle('nav-open');
            document.body.style.overflow = header.classList.contains('nav-open') ? 'hidden' : '';
        });

        const navLinks = document.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                header.classList.remove('nav-open');
                document.body.style.overflow = '';
            });
        });
    }

    // Determine current page type
    const isAirbnbPage = document.getElementById('airbnb-grid') !== null;
    const isPropertyPage = document.getElementById('property-grid') !== null;

    // Initial Render
    if (isAirbnbPage) {
        renderAirbnbs(JiraniData.getAirbnbs());
    } else if (isPropertyPage) {
        renderProperties(JiraniData.getProperties());
    }

    // Search Handler
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSearch(isAirbnbPage ? 'airbnb' : 'property');
        });
    }

    function handleSearch(type) {
        const locationInput = document.getElementById('location');
        const priceInput = document.getElementById('price');
        const typeInput = document.getElementById('type'); // Property page only
        const roomsInput = document.getElementById('rooms'); // Airbnb page only (new)

        const query = locationInput ? locationInput.value.toLowerCase().trim() : '';
        const priceQuery = priceInput ? parseInt(priceInput.value.replace(/[^0-9]/g, '')) : NaN;
        const typeQuery = typeInput ? typeInput.value.toLowerCase() : '';
        const roomsQuery = roomsInput ? roomsInput.value.toLowerCase() : '';

        const allItems = type === 'airbnb' ? JiraniData.getAirbnbs() : JiraniData.getProperties();

        const filtered = allItems.filter(item => {
            // Text Match (Best Fit logic: check title, location, desc, amenities)
            let textMatch = true;
            if (query) {
                const searchStr = `${item.title} ${item.location} ${item.desc} ${item.amenities || ''}`.toLowerCase();
                textMatch = searchStr.includes(query);
            }

            // Price Match (Max budget)
            let priceMatch = true;
            if (!isNaN(priceQuery) && priceQuery > 0) {
                priceMatch = item.price <= priceQuery;
            }

            // Type Match (Properties only)
            let typeMatch = true;
            if (type === 'property' && typeQuery) {
                typeMatch = item.type === typeQuery;
            }

            // Room Match (Best fit)
            // We search for the room string (e.g. "2 bedroom") in the description or title
            let roomMatch = true;
            if (roomsQuery) {
                if (item.rooms) {
                    // Explicit match if data exists (and user selected something)
                    roomMatch = item.rooms === roomsQuery;
                } else {
                    // Fallback: Best fit text match
                    if (roomsQuery === 'studio') {
                        roomMatch = item.title.toLowerCase().includes('studio') || item.desc.toLowerCase().includes('studio');
                    } else {
                        // Match "X bedroom", "X-bedroom", "X bd"
                        const r = roomsQuery;
                        const content = (item.title + ' ' + item.desc).toLowerCase();
                        roomMatch = content.includes(`${r} bedroom`) || content.includes(`${r}-bedroom`) || content.includes(`${r} bd`) || content.includes(`${r} br`) || content.includes(`${r} room`);
                    }
                }
            }

            return textMatch && priceMatch && typeMatch && roomMatch;
        });

        if (type === 'airbnb') {
            renderAirbnbs(filtered);
        } else {
            renderProperties(filtered);
        }
    }
});

// Shared helper for carousel button click (must be global or attached to window)
window.scrollCarousel = function (id, direction) {
    const container = document.getElementById(id);
    if (container) {
        const scrollAmount = container.clientWidth;
        container.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    }
};

// Render Functions
function renderAirbnbs(items) {
    const grid = document.getElementById('airbnb-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No results found mimicking your request. Try adjusting your search.</div>';
        return;
    }

    items.forEach(item => {
        const article = document.createElement('article');
        article.className = 'property-card';
        article.onclick = () => openDetailModal(item.id);
        article.style.cursor = 'pointer';

        let images = item.images || (item.image ? [item.image] : []);
        let imageHtml = '';
        const carouselId = `carousel-${item.id}`;

        if (images.length > 0) {
            imageHtml = `<div id="${carouselId}" class="image-carousel" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; height: 100%; width: 100%; scrollbar-width: none;">`;
            images.forEach(img => {
                imageHtml += `<img src="${img}" style="min-width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start;">`;
            });
            imageHtml += `</div>`;

            if (images.length > 1) {
                imageHtml += `
                    <button class="carousel-btn prev" onclick="event.stopPropagation(); scrollCarousel('${carouselId}', -1)">&#10094;</button>
                    <button class="carousel-btn next" onclick="event.stopPropagation(); scrollCarousel('${carouselId}', 1)">&#10095;</button>
                    <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.5); color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem;">1/${images.length}</div>
                `;
            }
        } else {
            imageHtml = `<div class="property-card__image-placeholder" style="background-color: ${item.imageColor || '#ddd'}; height: 100%; width: 100%;"></div>`;
        }

        article.innerHTML = `
            <div class="property-card__image-wrapper" style="position: relative;">
                ${imageHtml}
            </div>
            <div class="property-card__content">
                <div class="property-card__header">
                    <h3 class="property-card__title">${item.title}</h3>
                    <span class="property-card__rating">★ ${item.rating}</span>
                </div>
                <p class="property-card__desc">${item.desc}</p>
                <p class="property-card__dates">${item.dates}</p>
                <p class="property-card__price"><strong>KES ${item.price.toLocaleString()}</strong> night</p>
                <p style="font-size:0.8rem; color:#777; margin-top:4px;">${item.amenities || ''}</p>
            </div>
        `;
        grid.appendChild(article);
    });
}

function renderProperties(items) {
    const grid = document.getElementById('property-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No properties found. Try a different location or price range.</div>';
        return;
    }

    items.forEach(item => {
        const article = document.createElement('article');
        article.className = 'property-card';
        article.onclick = () => openDetailModal(item.id);
        article.style.cursor = 'pointer';

        let images = item.images || (item.image ? [item.image] : []);
        let imageHtml = '';
        const carouselId = `carousel-${item.id}`;

        if (images.length > 0) {
            imageHtml = `<div id="${carouselId}" class="image-carousel" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; height: 100%; width: 100%; scrollbar-width: none;">`;
            images.forEach(img => {
                imageHtml += `<img src="${img}" style="min-width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start;">`;
            });
            imageHtml += `</div>`;

            if (images.length > 1) {
                imageHtml += `
                    <button class="carousel-btn prev" onclick="event.stopPropagation(); scrollCarousel('${carouselId}', -1)">&#10094;</button>
                    <button class="carousel-btn next" onclick="event.stopPropagation(); scrollCarousel('${carouselId}', 1)">&#10095;</button>
                    <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.5); color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem;">1/${images.length}</div>
                `;
            }
        } else {
            imageHtml = `<div class="property-card__image-placeholder" style="background-color: ${item.imageColor || '#cce0ff'}; height: 100%; width: 100%;"></div>`;
        }

        article.innerHTML = `
            <div class="property-card__image-wrapper" style="position: relative;">
                ${imageHtml}
            </div>
            <div class="property-card__content">
                <div class="property-card__header">
                    <h3 class="property-card__title">${item.title}</h3>
                    <span class="property-card__rating">${item.rating}</span>
                </div>
                <p class="property-card__desc">${item.desc}</p>
                <p class="property-card__dates">${item.dates}</p>
                <p class="property-card__price"><strong style="color: #2d60ff;">KES ${item.price.toLocaleString()}</strong> ${item.priceLabel || ''}</p>
                <p style="font-size:0.8rem; color:#777; margin-top:4px;">${item.amenities || ''}</p>
            </div>
        `;
        grid.appendChild(article);
    });
}
