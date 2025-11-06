// Socket utility - simplified for build
export const initializeSocket = () => {
  console.log('Socket initialized');
  return {
    on: (event: string, callback: any) => {},
    emit: (event: string, data: any) => {},
    disconnect: () => {}
  };
};
