const dismissBtns = document.querySelectorAll('.x');

for (i = 0; i < dismissBtns.length; i++) {
	let btn = dismissBtns[i];
	btn.addEventListener('click', (e) => {
		e.preventDefault();
		btn.parentElement.remove();
	});
}
