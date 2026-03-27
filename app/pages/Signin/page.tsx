import RegisterForm from '@/app/components/RegisterForm'
import SigninForm from '@/app/components/SigninForm'
import React from 'react'


const page = () => {
  return (
  <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-8"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <SigninForm/>
      
    </div>
  )
}

export default page
