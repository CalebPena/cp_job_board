const removeMultiSelect = function () {
	const multiTextInputs = document.querySelector('#leaders');
	multiTextInputs.removeChild(multiTextInputs.lastChild);
};

const addMultiSelect = function () {
	const multiTextInputs = document.querySelector('#leaders');
	const template = document.createElement('template');
	const inside = `<span><label for="usernames">Username</label>
					<input type="text" id="usernames" name="usernames" minlength="2" required/></span>
                    <span><label for="emails">Email</label>
					<input type="emails" id="emails" name="emails" required/></span>`;
	template.innerHTML = `<div class="username">${inside}</div>`;
	multiTextInputs.appendChild(template.content.firstElementChild);
};

const multiInputButtonAdd = document.querySelector('#leader-btn-add');
multiInputButtonAdd.addEventListener('click', (e) => {
	e.preventDefault();
	addMultiSelect();
});

const multiInputButtonremove = document.querySelector('#leader-btn-remove');
multiInputButtonremove.addEventListener('click', (e) => {
	e.preventDefault();
	removeMultiSelect();
});

addMultiSelect();

const confirmMsg = function (msg) {
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
	.querySelectorAll('.confirm-remove-user')
	.forEach(
		confirmMsg('Are you sure that you want to remove this user from the class')
	);

document
	.querySelectorAll('.confirm-remove-tag')
	.forEach(confirmMsg('Are you sure that you want to remove this tag'));

document
	.querySelectorAll('.confirm-leader-join')
	.forEach(confirmMsg('Are you sure that you want to accept/deny this leader'));

const interestedStatus = document
	.querySelectorAll('.interested-status')
	.forEach((select) => {
		select.addEventListener('change', (e) => {
			axios
				.patch(`/class/${classId}/interested/${select.id}/status`, {
					status: select.value,
				})
				.catch((err) => console.error(err));
		});
	});
