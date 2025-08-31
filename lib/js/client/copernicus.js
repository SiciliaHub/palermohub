
        // Navigation state
        let currentLevel = 'home';
        let navigationHistory = ['home'];
        let currentCategory = '';
        let loadedItems = 0;


        function toggleDashboard() {
            const dashboard = document.getElementById('dashboardMenu');
            dashboard.classList.toggle('active');
        }

       function closeAllMenus() {
            document.getElementById('commandPalette').classList.remove('active');
            document.getElementById('tagCloudMenu').classList.remove('active');
            document.getElementById('infiniteMenu').classList.remove('active');
            document.getElementById('breadcrumbMenu').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                toggleCommandPalette();
            }
            if (e.key === 'Escape') {
                closeAllMenus();
                document.getElementById('dashboardMenu').classList.remove('active');
            }
        });
