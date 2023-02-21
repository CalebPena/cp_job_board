const s = document.querySelector('#status');
const reset = document.querySelector('#reset');
const cpCLass = document.querySelector('#cpClass-box');
const careerTrack = document.querySelector('#career-track')

const showIfLeader = function () {
	if (['Leader', 'Alumni'].includes(s.value)) {
		cpCLass.style.display = 'block';
		careerTrack.style.display = 'block';
	} else {
		cpCLass.style.display = 'none';
		careerTrack.style.display = 'none';
	}
};
if (reset) {
	reset.addEventListener('click', (e) => {
		setTimeout(showIfLeader);
	});
}

s.addEventListener('click', (e) => {
	showIfLeader();
});

showIfLeader();
