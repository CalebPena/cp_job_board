const dismissBtns = document.querySelectorAll('.x');

for (i = 0; i < dismissBtns.length; i++) {
	let btn = dismissBtns[i];
	btn.addEventListener('click', (e) => {
		e.preventDefault();
		btn.parentElement.remove();
	});
}

const toggleButton = document.getElementsByClassName('toggle-button')[0];
const navbarLinks = document.getElementsByClassName('nav-links')[0];

toggleButton.addEventListener('click', () => {
	navbarLinks.classList.toggle('active');
});

function insertAfter(referenceNode, newNode) {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

const passwordInput = document.querySelector('[type=password]');
const togglePasswordContainer = document.createElement('div');
togglePasswordContainer.classList.add('show-password');
const togglePasswordLabel = document.createElement('label');
togglePasswordLabel.setAttribute('for', 'toggle-password');
togglePasswordLabel.innerText = 'Show password';
const togglePassword = document.createElement('input');
togglePassword.id = 'toggle-password';
togglePassword.setAttribute('type', 'checkbox');
togglePassword.addEventListener('click', () => {
	if (passwordInput.type === 'password') {
		passwordInput.setAttribute('type', 'text');
	} else {
		passwordInput.setAttribute('type', 'password');
	}
});
togglePasswordContainer.appendChild(togglePasswordLabel);
togglePasswordContainer.appendChild(togglePassword);
insertAfter(passwordInput, togglePasswordContainer);
