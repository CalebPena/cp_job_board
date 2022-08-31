class CustomSelect {
	constructor(originalSelect) {
		this.originalSelect = originalSelect;
		this.customSelect = document.createElement('span');
		this.customSelect.classList.add('select');

		this.originalSelect.querySelectorAll('option').forEach((optionElement) => {
			const itemElement = document.createElement('span');

			itemElement.classList.add('select__item');
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

const removeMultiSelect = function () {
	const multiTextInputs = document.querySelector('#careerTracks');
	multiTextInputs.removeChild(multiTextInputs.lastChild);
};

const addMultiSelect = function (innerText) {
	let inText = innerText;
	if (innerText == null) {
		inText = '';
	}
	const multiTextInputs = document.querySelector('#careerTracks');
	const template = document.createElement('template');
	template.innerHTML = `<div class="careerTrack">
						<label for="careerTrack">Career Track</label>
						<input type="text" id="careerTrack" name="careerTracks" value="${inText}" maxlength="64" required/>
					</div>`;
	multiTextInputs.appendChild(template.content.firstElementChild);
};

const multiInputButtonAdd = document.querySelector('#careerTrack-btn-add');
multiInputButtonAdd.addEventListener('click', (e) => {
	e.preventDefault();
	addMultiSelect();
});

const multiInputButtonremove = document.querySelector(
	'#careerTrack-btn-remove'
);

multiInputButtonremove.addEventListener('click', (e) => {
	e.preventDefault();
	removeMultiSelect();
});

if (jobId && classId) {
	axios
		.get(`/class/${classId}/${jobId}/career-tracks`)
		.then((res) => {
			for (i = 0; i < res.data.length; i++) {
				addMultiSelect(res.data[i]);
			}
		})
		.catch((err) => {
			console.log(err);
		});
} else {
	addMultiSelect();
}
