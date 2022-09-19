const interestedBtns = document.querySelectorAll('.interestedBtn');

const changeBtn = function (element, classId, jobId) {
	if (element.classList.contains('not-inter')) {
		axios
			.post(`/class/${classId}/${jobId}/interested`, {})
			.then((res) => {
				element.classList.remove('not-inter');
				element.classList.add('inter');
				element.innerHTML = 'Remove from Interested';
			})
			.catch(function (error) {
				console.log(error);
			});
	} else if (element.classList.contains('inter')) {
		axios
			.post(`/class/${classId}/${jobId}/not-interested`, {})
			.then((res) => {
				element.classList.remove('inter');
				element.classList.add('not-inter');
				element.innerHTML = 'Add to Interested';
			})
			.catch(function (error) {
				console.log(error);
			});
	}
};

for (i = 0; i < interestedBtns.length; i++) {
	let btn = interestedBtns[i];
	let jobId = btn.getAttribute('jobId');
	btn.addEventListener('click', (e) => {
		e.preventDefault;
		changeBtn(btn, classId, jobId);
	});
}

class Filter {
	constructor(jobs) {
		this.jobs = jobs;
		this.title = undefined;
		this.careerTrack = undefined;
		this.salary = 0;
		this.salaryType = undefined;
		this.new = false;
		this.tags = [
			'Core',
			'Alumni',
			'Temp',
			'Part Time',
			'Remote',
			'Background Check',
			'Flexable Hours',
		];
		this.archived = false;
	}
	filter(formData) {
		this._update(formData);
		const conditions = this._conditions();
		this.jobs.forEach((job) => {
			let jobCard = document.getElementById(job._id);
			if (conditions(job)) {
				jobCard.style.display = 'block';
			} else {
				jobCard.style.display = 'none';
			}
		});
	}
	_update(formData) {
		formData.title ? (this.title = formData.title) : (this.title = undefined);
		formData.careerTrack
			? (this.careerTrack = formData.careerTrack)
			: (this.careerTrack = undefined);
		formData.salary !== ''
			? (this.salary = parseFloat(formData.salary))
			: (this.salary = 0);
		formData.salaryType
			? (this.salaryType = formData.salaryType)
			: (this.salaryType = undefined);
		this.tags = formData.tags;
		this.new = formData.new;
		this.archived = formData.showArchive;
	}
	_conditions() {
		const that = this;
		const threeDaysAgo = new Date().getTime() - 3 * 24 * 60 * 60 * 1000;
		return function (job) {
			if (!that.archived && job.archive === true) return false;
			if (that.title && !that._in(job.jobTitle, that.title)) {
				return false;
			}
			if (
				that.careerTrack &&
				!job.careerTracks.some((cTrack) => that._in(cTrack, that.careerTrack))
			) {
				return false;
			}
			if (that.salary > job.salary) return false;
			if (that.salaryType && that.salaryType !== job.salaryType) {
				return false;
			}
			if (that.new && new Date(job.dateAdded).getTime() < threeDaysAgo) {
				return false;
			}
			if (job.tags.length !== 0) {
				return that.tags.every((tag) => job.tags.includes(tag));
			} else if (that.tags.length === 0) {
				return true;
			} else {
				return false;
			}
		};
	}
	_in(str, sub) {
		return str.toLowerCase().indexOf(sub.toLowerCase()) !== -1;
	}
}

const useFilter = function (filter) {
	const formData = Array.from(document.querySelectorAll('.filter')).reduce(
		(acc, input) => {
			return { ...acc, [input.id]: input.value };
		},
		{}
	);
	const tags = document.querySelector('#filter-tags');
	formData.tags = Array.from(tags.options)
		.filter((option) => option.selected)
		.map((option) => option.value);
	formData.new = document.querySelector('#new').checked;
	formData.showArchive = document.querySelector('#show-archive').checked;
	filter.filter(formData);
};

axios
	.get(`/class/${classId}/jobs`)
	.then((res) => {
		console.log(res.data[0]);
		const filter = new Filter(res.data);
		useFilter(filter);
		const filterForm = document.querySelector('#filter-jobs');
		filterForm.addEventListener('submit', (ev) => {
			ev.preventDefault();
			useFilter(filter);
		});
	})
	.catch(function (error) {
		console.error(error);
	});

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
	.querySelectorAll('.confirm-archive')
	.forEach(confirmMsg('Are you sure that you want to archive this class'));

document
	.querySelectorAll('.confirm-bring-back')
	.forEach(confirmMsg('Are you sure that you want to bring back this class'));

const interestedStatus = document
	.querySelectorAll('.interested-status')
	.forEach((select) => {
		select.addEventListener('change', (e) => {
			axios
				.patch(`/class/${classId}/interested/${select.id}/status`, {
					status: select.value,
				})
				.then((res) => {
					console.log('good');
				})
				.catch((err) => console.error(err));
		});
	});
