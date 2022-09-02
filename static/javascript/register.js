const s = document.querySelector('#status');
const cpCLass = document.querySelector('#cpClassBox');

s.onChange = () => {
	if (s.value === 'Leader') {
		cpCLass.styles.display = 'block';
	} else {
		cpCLass.styles.display = 'none';
	}
};
