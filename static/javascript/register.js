const s = document.querySelector('#status');
const cpCLass = document.querySelector('#cpClass-box');

s.addEventListener('click', (e) => {
	if (s.value === 'Leader') {
		cpCLass.style.display = 'block';
	} else {
		cpCLass.style.display = 'none';
	}
});
