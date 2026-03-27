
// "use client";

// import React, { useState } from "react";
// import { Button, Checkbox, Label } from "flowbite-react";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { createAccount, login } from "@/lib/user-services"; 

// const RegisterForm = () => {
//   const { push } = useRouter();

 
//   const [switchBool, setSwitchBool] = useState(false); 


//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     city: "",
//     skill: "",
//   });

//   const handleSwitch = () => setSwitchBool(!switchBool);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!switchBool) {
   
//       const success = await createAccount(formData);
//       if (success) {
//         alert("Account Created! Please Sign In.");
//         setSwitchBool(true); 
//       } else {
//         alert("Registration failed. Email might already exist.");
//       }
//     } else {
//       // LOGIN LOGIC
//     //   const token = await login({ 
//     //     UserEmail: formData.email, 
//     //     password: formData.password 
//     //   });

// //       if (token) {
// //         localStorage.setItem("token", token.token);
// //         push("/HelpCategory");
// //       } else {
// //         alert("LOGIN NO GOOD!");
// //       }
//     }
//   };

 
//   const inputContainer = "w-full max-w-[505px] h-[60px] border-2 border-black rounded-[15px] bg-white flex items-center overflow-hidden mb-4 shadow-sm focus-within:ring-2 focus-within:ring-black transition-all";
//   const inputBase = "w-full h-full text-center border-none focus:ring-0 text-black placeholder-black/50 font-medium bg-transparent";

//   return (
//     <div className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-8"
//          style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}>
 
      


//        <motion.div 
//         initial={{ y: -20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm"
//       >
//         <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
//        {switchBool ? "Sign In" : "Register"}
//         </h1>
//       </motion.div>

//       <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col items-center">
        
//         <AnimatePresence mode="wait">
//           <motion.div 
//             key={switchBool ? "login" : "register"}
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -20 }}
//             className="w-full"
//           >
     
//             {!switchBool && (
//               <>
//                 <div className={inputContainer}>
//                   <input 
//                     type="text" placeholder="Full Name" className={inputBase} required
//                     onChange={(e) => setFormData({...formData, name: e.target.value})}
//                   />
//                 </div>
//                 <div className={inputContainer}>
//                   <input 
//                     type="text" placeholder="Your City" className={inputBase} required
//                     onChange={(e) => setFormData({...formData, city: e.target.value})}
//                   />
//                 </div>
//                 <div className={inputContainer}>
//                   <input 
//                     type="text" placeholder="Your Skill" className={inputBase} required
//                     onChange={(e) => setFormData({...formData, skill: e.target.value})}
//                   />
//                 </div>
//               </>
//             )}

          
//             <div className={inputContainer}>
//               <input 
//                 type="email" placeholder="Email Address" className={inputBase} required
//                 onChange={(e) => setFormData({...formData, email: e.target.value})}
//               />
//             </div>
//             <div className={inputContainer}>
//               <input 
//                 type="password" placeholder="Password" className={inputBase} required
//                 onChange={(e) => setFormData({...formData, password: e.target.value})}
//               />
//             </div>
//           </motion.div>
//         </AnimatePresence>

  
//         {!switchBool && (
//           <div className="flex items-center gap-3 bg-white/60 px-4 py-2 rounded-lg border border-black/10 mb-4">
//             <Checkbox id="agree" className="border-2 border-black" required />
//             <Label htmlFor="agree" className="font-bold text-black">I accept the terms</Label>
//           </div>
//         )}

     
//         <Button 
//           type="submit" 
//           className="w-full max-w-100 h-17.5 md:h-22.5 bg-[#5F4F4F]/80 border-2 border-black rounded-[30px] hover:bg-black transition-all"
//         >
//           <span className="text-white text-2xl font-black uppercase tracking-widest">
//             {switchBool ? "Login" : "Create Account"}
//           </span>
//         </Button>

     


     
//         <div className="mt-8 text-center text-black font-bold">
//           {switchBool ? "New to TimeBank?" : "Already have an account?"}{" "}
//           <button 
//             type="button" 
//             className="underline font-black text-xl ml-2 hover:text-blue-900"
//             onClick={handleSwitch}
//           >
//             {switchBool ? 'Register Here' : "Sign in here"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default RegisterForm;




"use client";

import React, { useState } from "react";
import { Button, Checkbox, Label } from "flowbite-react";
import { useRouter } from "next/navigation";
import { createAccount } from "@/lib/user-services";
import { motion } from "framer-motion";

const RegisterPage = () => {
  const { push } = useRouter();

  const [register, setRegister] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    skill: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await createAccount(register);

    if (success) {
      alert("Account Created! Please Sign In.");
      push("/login"); 
    } else {
      alert("Registration failed. Email might already exist.");
    }
  };

  const inputContainer =
    "w-full max-w-[505px] h-[60px] border-2 border-black rounded-[15px] bg-white flex items-center mb-4";
  const inputBase =
    "w-full h-full text-center border-none focus:ring-0 text-black";

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-cover bg-center"
         style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}>

          <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
       Register
        </h1>
      </motion.div>

      <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col items-center">

        <div className={inputContainer}>
          <input type="text" placeholder="Full Name" required
            className={inputBase}
            onChange={(e) => setRegister({ ...register, name: e.target.value })}
          />
        </div>

        <div className={inputContainer}>
          <input type="text" placeholder="City" required
            className={inputBase}
            onChange={(e) => setRegister({ ...register, city: e.target.value })}
          />
        </div>

        <div className={inputContainer}>
          <input type="text" placeholder="Skill" required
            className={inputBase}
            onChange={(e) => setRegister({ ...register, skill: e.target.value })}
          />
        </div>

        <div className={inputContainer}>
          <input type="email" placeholder="Email" required
            className={inputBase}
            onChange={(e) => setRegister({ ...register, email: e.target.value })}
          />
        </div>

        <div className={inputContainer}>
          <input type="password" placeholder="Password" required
            className={inputBase}
            onChange={(e) => setRegister({ ...register, password: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Checkbox required />
          <Label>I accept terms</Label>
        </div>

        <Button type="submit" className="w-full">Create Account</Button>

        <p className="mt-4">
          Already have an account?
          <span
            className="underline ml-2 cursor-pointer"
            onClick={() => push("/pages/Signin")}
          >
            Sign In
          </span>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;