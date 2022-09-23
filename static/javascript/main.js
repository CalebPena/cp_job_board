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
