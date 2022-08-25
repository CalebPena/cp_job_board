const removeMultiSelect = function () {
	const multiTextInputs = document.querySelector('#leaders');
	multiTextInputs.removeChild(multiTextInputs.lastChild);
};

const addMultiSelect = function () {
	const multiTextInputs = document.querySelector('#leaders');
	const template = document.createElement('template');
	const inside = `<label for="usernames">Username</label>
					<input type="text" id="usernames" name="usernames" required/>
                    <label for="emails">Email</label>
					<input type="emails" id="emails" name="emails" required/>`;
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
