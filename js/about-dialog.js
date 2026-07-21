const openButton = document.querySelector('[data-about-open]');
const dialog = document.querySelector('[data-about-dialog]');
const closeButton = dialog?.querySelector('[data-about-close]');

if (openButton && dialog && closeButton) {
    let returnFocus = null;
    let shouldRestoreFocus = true;

    function isHomePage() {
        return document.documentElement.dataset.page === 'home';
    }

    function openDialog() {
        if (!isHomePage() || dialog.open) {
            return;
        }

        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openButton;
        shouldRestoreFocus = true;

        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }

        closeButton.focus();
    }

    function closeDialog({ restoreFocus = true } = {}) {
        if (!dialog.open && !dialog.hasAttribute('open')) {
            return;
        }

        shouldRestoreFocus = restoreFocus;
        if (typeof dialog.close === 'function') {
            dialog.close();
        } else {
            dialog.removeAttribute('open');
            handleClosedDialog();
        }
    }

    function handleClosedDialog() {
        const focusTarget = returnFocus;
        const restoreFocus = shouldRestoreFocus;
        returnFocus = null;
        shouldRestoreFocus = true;

        if (restoreFocus && isHomePage() && focusTarget?.isConnected) {
            requestAnimationFrame(() => {
                if (isHomePage() && focusTarget.isConnected) {
                    focusTarget.focus();
                }
            });
        }
    }

    openButton.addEventListener('click', openDialog);
    closeButton.addEventListener('click', () => closeDialog());
    dialog.addEventListener('close', handleClosedDialog);
    dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeDialog();
    });
    dialog.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeDialog();
        }
    });
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
            closeDialog();
        }
    });

    document.addEventListener('shell:navigate-intent', () => closeDialog({ restoreFocus: false }));
    document.addEventListener('shell:navigation', () => {
        if (!isHomePage()) {
            closeDialog({ restoreFocus: false });
        }
    });
    window.addEventListener('popstate', () => closeDialog({ restoreFocus: false }));
}
