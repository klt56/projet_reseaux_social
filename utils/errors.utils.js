module.exports.signUpErrors = (err) => {
    let errors = { pseudo: "", email: "", password: "" };

    if (err.message.includes("pseudo"))
     errors.pseudo = "Pseudo incorrect ou déjà pris.";

    if (err.message.includes("email"))
      errors.email = "Email incorrect.";

    if (err.message.includes("password"))
       errors.password = "Le mot de passe doit faire 6 caractères minimum.";


 };

module.exports.signInErrors = (err) => {
   let errors = { email: '', password: ''}

   if (err.message.includes("email"))
   errors.email = "Email inconnu";

   if (err.message.includes("password"))
   errors.password = "Le mot de passe ne correspond pas"

   return errors
}
