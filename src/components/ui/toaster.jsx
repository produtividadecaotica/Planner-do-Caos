import { Toaster } from 'react-hot-toast'

export default function PCToaster() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 4000,
        className: 'pc-toast',
      }}
    />
  )
}
