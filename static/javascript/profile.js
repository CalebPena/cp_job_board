const confirmMsg = function (msg, e) {
	return (form) => {
		form.addEventListener('submit', (e) => {
			const result = confirm(msg);
			if (result === false) {
				e.preventDefault();
			}
		});
	};
};

document
	.querySelectorAll('.confirm-update')
	.forEach(confirmMsg('Are you sure that you want to update your profile.'));

document
	.querySelectorAll('.confirm-leave')
	.forEach(confirmMsg('Are you sure that you want to leave this class.'));

document
	.querySelectorAll('.confirm-admin-join')
	.forEach(
		confirmMsg('Are you sure that you want to accept/deny this admin request')
	);
