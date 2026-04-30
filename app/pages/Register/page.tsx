import RegisterForm from '@/app/components/RegisterForm'
import React from 'react'


const page = () => {
  return (
  

  <div
      className="min-h-screen flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:p-8"
      style={{
        background: `
          radial-gradient(ellipse at 15% 15%, #38bdf8 0%, transparent 50%),
          radial-gradient(ellipse at 85% 10%, #818cf8 0%, transparent 45%),
          radial-gradient(ellipse at 80% 85%, #34d399 0%, transparent 50%),
          radial-gradient(ellipse at 10% 80%, #fb923c 0%, transparent 45%),
          linear-gradient(160deg, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%)
        `,
      }}
    >
      <RegisterForm/>
      
    </div>
  )
}

export default page
