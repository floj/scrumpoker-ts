import ToastNotifier from "js-toast-notifier";
const toaster = new ToastNotifier({
  position: "top-center",
  timeout: 2000,
  showCloseButton: true,
  pauseOnHover: true,
  showProgress: true,
});

export { toaster };
