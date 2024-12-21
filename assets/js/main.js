class CircularGallery {
    constructor() {
        this.title = 'RACCOONS GALLERY';
        this.gallery = document.querySelector('.circular-gallery');
        this.items = [];
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.isAnimating = false;
        this.radius = window.innerHeight * 0.4;
        this.overlay = document.querySelector('.gallery-overlay');
        this.overlayContent = document.querySelector('.overlay-content');
        this.autoRotationSpeed = 0.001;
        this.isAutoRotating = true;
        this.lastFrameTime = Date.now();
        this.isDragging = false;
        this.lastMouseX = null;
        this.isMobile = 'ontouchstart' in window;
        this.touchStartX = 0;
        this.touchStartY = 0;

        // Müzik kontrolü
        this.bgMusic = document.getElementById('bgMusic');
        if (this.bgMusic) {
            this.bgMusic.volume = 0.3;
            this.bgMusic.play();
        }

        this.musicToggle = document.getElementById('musicToggle');
        this.setupMusicControls();

        this.init();
    }

    init() {
        this.createGalleryItems();
        this.setupEventListeners();
        this.update();
        this.animate();
        this.setupResizeHandler();
        this.gallery.classList.add('loaded');
    }

    setupEventListeners() {
        let lastWheelTime = 0;
        let wheelTimeout;
        let touchTimeout;
        let touchStartY;
        let lastTouchTime = 0;

        // Mobil için touch events
        if (this.isMobile) {
            this.gallery.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
                this.lastTouchX = this.touchStartX;
                this.isDragging = true;
                this.isAutoRotating = false;
            }, { passive: true });

            this.gallery.addEventListener('touchmove', (e) => {
                if (!this.isDragging) return;

                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;

                // Yatay kaydırma mesafesi
                const deltaX = touchX - this.lastTouchX;
                
                // Hassasiyet ayarı (mobil için daha hassas)
                const sensitivity = 1.5;
                
                // Galerinin dönüş açısını güncelle
                this.currentAngle += deltaX * sensitivity * 0.01;
                
                this.lastTouchX = touchX;

                // Dikey kaydırmayı engelle
                if (Math.abs(deltaX) > 5) {
                    e.preventDefault();
                }
            }, { passive: false });

            this.gallery.addEventListener('touchend', () => {
                this.isDragging = false;
                
                // Kaydırma bittikten sonra otomatik dönüşü başlat
                setTimeout(() => {
                    if (!this.isDragging) {
                        this.isAutoRotating = true;
                    }
                }, 1500);
            });
        }

        // Desktop için mouse events
        else {
            window.addEventListener('mousedown', (e) => {
                if (e.button === 0 || e.button === 1) {
                    e.preventDefault();
                    this.isDragging = true;
                    this.isAutoRotating = false;
                    this.lastMouseX = e.clientX;
                    document.body.style.cursor = 'grabbing';
                }
            });

            window.addEventListener('mousemove', (e) => {
                if (this.isDragging && this.lastMouseX !== null) {
                    const deltaX = e.clientX - this.lastMouseX;
                    this.lastMouseX = e.clientX;
                    this.currentAngle -= deltaX * 0.01;
                }
            });

            window.addEventListener('mouseup', (e) => {
                if (this.isDragging && (e.button === 0 || e.button === 1)) {
                    this.isDragging = false;
                    this.lastMouseX = null;
                    this.isAutoRotating = true;
                    document.body.style.cursor = '';
                }
            });

            window.addEventListener('mouseleave', () => {
                if (this.isDragging) {
                    this.isDragging = false;
                    this.lastMouseX = null;
                    this.isAutoRotating = true;
                    document.body.style.cursor = '';
                }
            });

            window.addEventListener('wheel', (e) => {
                e.preventDefault();
                
                const now = Date.now();
                if (now - lastWheelTime < 50) return;
                lastWheelTime = now;

                const delta = e.deltaY * 0.0008;
                this.currentAngle += delta;

                this.isAutoRotating = false;
                clearTimeout(wheelTimeout);

                wheelTimeout = setTimeout(() => {
                    this.isAutoRotating = true;
                }, 1000);
            }, { passive: false });
        }

        // Overlay click event
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeOverlay();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeOverlay();
                setTimeout(() => {
                    this.isAutoRotating = true;
                }, 500);
            }
        });
    }

    setupMusicControls() {
        // Müzik başlangıçta kapalı
        this.bgMusic.volume = 0.3; // Ses seviyesi
        
        this.musicToggle.addEventListener('click', () => {
            if (this.bgMusic.paused) {
                this.bgMusic.play();
                this.musicToggle.textContent = '';
            } else {
                this.bgMusic.pause();
                this.musicToggle.textContent = '';
            }
        });

        // Kullanıcı etkileşimi ile müziği başlat
        document.addEventListener('click', () => {
            if (!this.bgMusic.played.length) {
                this.bgMusic.play().catch(() => {
                    // Otomatik oynatma engellendiyse sessiz simgesini göster
                    this.musicToggle.textContent = '';
                });
            }
        }, { once: true });
    }

    createGalleryItems() {
        nftCollection.forEach((nft, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const imgContainer = document.createElement('div');
            imgContainer.className = 'img-container';
            
            const img = new Image();
            img.src = nft.image;
            img.alt = `NFT ${nft.id}`;
            img.loading = 'lazy';
            
            img.onerror = () => {
                console.error(`Failed to load image: ${nft.image}`);
                item.classList.add('error');
            };
            
            img.onload = () => {
                item.classList.add('loaded');
                console.log(`Loaded image: ${nft.image}`);
            };
            
            imgContainer.appendChild(img);
            item.appendChild(imgContainer);
            this.gallery.appendChild(item);
            
            item.addEventListener('click', (e) => {
                if (item.classList.contains('loaded')) {
                    this.isAutoRotating = false; 
                    this.showOverlay(img.src, e);
                }
            });
            
            this.items.push({
                element: item,
                angle: (index * 2 * Math.PI) / nftCollection.length,
                index
            });
        });
    }

    rotateGallery(delta) {
        if (this.isAnimating) return;
        
        const angleIncrement = (2 * Math.PI) / nftCollection.length;
        
        if (delta > 0) {
            this.targetAngle += angleIncrement;
        } else {
            this.targetAngle -= angleIncrement;
        }
        
        this.isAnimating = true;
    }

    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.radius = window.innerHeight * 0.4;
                this.update();
            }, 100);
        }, { passive: true });
    }

    update() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        // Otomatik dönüş sadece sürüklemiyorken
        if (!this.isDragging && this.isAutoRotating) {
            this.currentAngle += this.autoRotationSpeed * deltaTime * 60;
        }

        this.items.forEach(item => {
            const angle = item.angle + this.currentAngle;
            const x = Math.cos(angle) * this.radius;
            const z = Math.sin(angle) * this.radius;
            const scale = (z + this.radius) / (2 * this.radius);
            
            const transform = `
                translate3d(${x}px, 0, ${z}px)
                scale(${0.5 + scale * 0.5})
                rotateY(${-angle * 180 / Math.PI}deg)
            `;
            
            item.element.style.transform = transform;
            item.element.style.zIndex = Math.round(scale * 1000);
            item.element.style.opacity = 0.3 + scale * 0.7;
        });

        requestAnimationFrame(() => this.update());
    }

    animate() {
        this.update();
        requestAnimationFrame(() => this.animate());
    }

    showOverlay(imgSrc) {
        const overlay = this.overlay;
        const content = this.overlayContent;
        
        content.innerHTML = `
            <div class="img-wrapper">
                <div class="close-area top"></div>
                <div class="img-container">
                    <img src="${imgSrc}" alt="NFT Image">
                </div>
                <div class="close-area bottom"></div>
            </div>
        `;

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Üst ve alt alanlara tıklama olayları
        const closeAreas = content.querySelectorAll('.close-area');
        closeAreas.forEach(area => {
            area.addEventListener('click', () => {
                this.closeOverlay();
            });
        });
    }

    closeOverlay() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            if (!this.overlay.classList.contains('active')) {
                this.overlayContent.innerHTML = '';
            }
        }, 300);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const gallery = new CircularGallery();

    window.addEventListener('load', () => {
        const loading = document.querySelector('.loading');
        loading.classList.add('hidden');

        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
    });
});
