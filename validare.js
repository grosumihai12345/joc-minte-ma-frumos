function checkExistingUsername() {
  const usernameInput = document.querySelector('input[name="username"]');
  const username = usernameInput.value;

  fetch("/joc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  })
    .then((response) => response.text())
    .then((data) => {
      if (data === "Numele de utilizator este deja luat.") {
        alert("Utilizatorul este deja existent.");
      } else {
        usernameInput.closest("form").submit();
      }
    })
    .catch((error) => {
      console.error(error);
      alert("A apărut o eroare. Vă rugăm să încercați din nou mai târziu.");
    });
}
