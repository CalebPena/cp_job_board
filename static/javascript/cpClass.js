const s = document.querySelector('#status');
const reset = document.querySelector('#reset');
const cpCLass = document.querySelector('#cpClass-box');

const showIfLeader = function () {
	if (s.value === 'Leader') {
		cpCLass.style.display = 'block';
	} else {
		cpCLass.style.display = 'none';
	}
};

reset.addEventListener('click', (e) => {
	setTimeout(showIfLeader);
});

s.addEventListener('click', (e) => {
	showIfLeader();
});

showIfLeader();
