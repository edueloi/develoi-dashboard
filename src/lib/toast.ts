// Adaptador: `toast.success(...)` / `toast.error(...)` usando o ToastProvider do app.
// Os componentes do bot e do perfil usavam o react-hot-toast, que nunca teve um <Toaster />
// montado, então nenhum aviso aparecia. O ToastProvider registra aqui as funções reais.
type Notify = (message: string) => void;
interface Impl { success: Notify; error: Notify; info: Notify; warning: Notify }

let impl: Impl | null = null;

export const registerToast = (value: Impl) => { impl = value; };

export const toast = {
  success: (message: string) => impl?.success(message),
  error: (message: string) => impl?.error(message),
  info: (message: string) => impl?.info(message),
  warning: (message: string) => impl?.warning(message),
};
