import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import router from './router';

function App() {
  useEffect(() => {
    // 初始化超自然司法案例库平台
    console.log('超自然司法案例库平台启动中...');
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
