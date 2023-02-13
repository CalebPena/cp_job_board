class CustomSelect {
	constructor(originalSelect) {
		this.originalSelect = originalSelect;
		this.customSelect = document.createElement('span');
		this.customSelect.classList.add('select');

		this.originalSelect.querySelectorAll('option').forEach((optionElement) => {
			const itemElement = document.createElement('span');

			itemElement.classList.add('select__item', 'pill');
			itemElement.textContent = optionElement.textContent;
			this.customSelect.appendChild(itemElement);

			if (optionElement.selected) {
				this._select(itemElement);
			}

			itemElement.addEventListener('click', () => {
				if (
					this.originalSelect.multiple &&
					itemElement.classList.contains('select__item--selected')
				) {
					this._deselect(itemElement);
				} else {
					this._select(itemElement);
				}
			});
		});

		this.originalSelect.insertAdjacentElement('afterend', this.customSelect);
		this.originalSelect.style.display = 'none';
	}

	_select(itemElement) {
		const index = Array.from(this.customSelect.children).indexOf(itemElement);

		if (!this.originalSelect.multiple) {
			this.customSelect.querySelectorAll('.select__item').forEach((el) => {
				el.classList.remove('select__item--selected');
			});
		}

		this.originalSelect.querySelectorAll('option')[index].selected = true;
		itemElement.classList.add('select__item--selected');
	}

	_deselect(itemElement) {
		const index = Array.from(this.customSelect.children).indexOf(itemElement);

		this.originalSelect.querySelectorAll('option')[index].selected = false;
		itemElement.classList.remove('select__item--selected');
	}
}

document.querySelectorAll('.custom-select').forEach((selectElement) => {
	new CustomSelect(selectElement);
});

const options = [
	['bold', 'italic', 'underline', 'strike'],
	[{ list: 'ordered' }, { list: 'bullet' }],
	['link'],
	['clean'],
];

const description = new Quill('#description', {
	modules: { toolbar: options },
	theme: 'snow',
});

const toolbar = description.getModule('toolbar');

toolbar.addHandler('link', function (value) {
	if (value) {
		const href = prompt('Enter the URL');
		this.quill.format('link', href);
	} else {
		this.quill.format('link', false);
	}
});

description.on('editor-change', function (eventName, ...args) {
	console.log(JSON.stringify(description.getContents()));
});

const jobForm = document.querySelector('#job-form')
jobForm.addEventListener('submit', (e) => {
	jobForm.description.value = JSON.stringify(description.getContents());
})