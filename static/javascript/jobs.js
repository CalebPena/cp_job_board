const interestedBtns = document.querySelectorAll('.interestedBtn');

const changeBtn = function (element, classId, jobId) {
	const dreamJob = document.querySelector(`#dream-job-form-${jobId}`);
	if (element.classList.contains('not-inter')) {
		axios
			.post(`/class/${classId}/${jobId}/interested`, {})
			.then((res) => {
				element.classList.remove('not-inter');
				element.classList.add('inter');
				element.innerHTML = 'Remove from Interested';
				dreamJob.classList.remove('hide');
			})
			.catch(function (error) {
				console.error(error);
			});
	} else if (element.classList.contains('inter')) {
		axios
			.post(`/class/${classId}/${jobId}/not-interested`, {})
			.then((res) => {
				element.classList.remove('inter');
				element.classList.add('not-inter');
				element.innerHTML = 'Add to Interested';
				dreamJob.classList.add('hide');
			})
			.catch(function (error) {
				console.error(error);
			});
	}
};

for (i = 0; i < interestedBtns.length; i++) {
	let btn = interestedBtns[i];
	let jobId = btn.getAttribute('jobId');
	btn.addEventListener('click', (e) => {
		e.preventDefault();
		changeBtn(btn, classId, jobId);
	});
}

const dreamJobs = document.querySelectorAll('.dream-job-checkbox');
dreamJobs.forEach((checkbox) => {
	let jobId = checkbox.getAttribute('jobId');
	checkbox.addEventListener('change', (e) => {
		axios
			.post(`/class/${classId}/${jobId}/dream-job`, {
				dreamJob: checkbox.checked,
			})
			.catch(function (error) {
				console.error(error);
			});
	});
});

class Filter {
	constructor(jobs) {
		this.jobs = jobs;
		this.title = undefined;
		this.company = undefined;
		this.careerTracks = [];
		this.salary = 0;
		this.salaryType = undefined;
		this.new = false;
		this.tags = [];
		this.archived = false;
		this.newInterested = false;
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
	updateJobs(jobs) {
		this.jobs = jobs;
	}
	_update(formData) {
		formData.title ? (this.title = formData.title) : (this.title = undefined);
		formData.company
			? (this.company = formData.company)
			: (this.company = undefined);
		formData.salary !== ''
			? (this.salary = parseFloat(formData.salary))
			: (this.salary = 0);
		formData.salaryType
			? (this.salaryType = formData.salaryType)
			: (this.salaryType = undefined);
		this.careerTracks = formData.careerTracks;
		this.tags = formData.tags;
		this.new = formData.new;
		this.archived = formData.showArchive;
		this.newInterested = formData.newInterested;
	}
	_conditions() {
		const that = this;
		const threeDaysAgo = new Date().getTime() - 3 * 24 * 60 * 60 * 1000;
		return function (job) {
			if (!that.archived && job.archive === true) return false;
			if (that.archived && job.archive === false) return false;

			if (
				that.newInterested &&
				!job.interested.some((leader) => leader.status === 'new')
			) {
				return false;
			}
			if (that.title && !that._in(job.jobTitle, that.title)) {
				return false;
			}
			if (that.company && !that._in(job.company, that.company)) {
				return false;
			}
			if (that.salary > job.salary.min) return false;

			if (that.salaryType && that.salaryType !== job.salaryType) {
				return false;
			}
			if (that.new && new Date(job.dateAdded).getTime() < threeDaysAgo) {
				return false;
			}
			if (job.tags.length !== 0) {
				if (!that.tags.every((tag) => job.tags.includes(tag))) {
					return false;
				}
			} else if (that.tags.length !== 0) {
				return false;
			}

			if (job.careerTracks.length !== 0) {
				if (!that.careerTracks.every((tag) => job.careerTracks.includes(tag))) {
					return false;
				}
			} else if (that.careerTracks.length !== 0) {
				return false;
			}
			return true;
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
	const careerTracks = document.querySelector('#filter-career-track');
	formData.careerTracks = Array.from(careerTracks.options)
		.filter((option) => option.selected)
		.map((option) => option.value);
	formData.new = document.querySelector('#new').checked;
	try {
		formData.showArchive = document.querySelector('#show-archive').checked;
		formData.newInterested = document.querySelector('#new-interested').checked;
	} catch (err) {
		formData.showArchive = false;
		formData.newInterested = false;
	}
	filter.filter(formData);
};

axios
	.get(`/class/${classId}/jobs`)
	.then((res) => {
		const filter = new Filter(res.data);
		useFilter(filter);
		document.querySelectorAll('.interested-status').forEach((select) => {
			select.addEventListener('change', async (e) => {
				try {
					await axios.patch(
						`/class/${classId}/interested/${select.id}/status`,
						{
							status: select.value,
						}
					);
					axios
						.get(`/class/${classId}/jobs`)
						.then((res) => {
							filter.updateJobs(res.data);
						})
						.catch(function (error) {
							console.error(error);
						});
				} catch (err) {
					console.error(err);
				}
			});
		});
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

document.querySelectorAll('.interested-box').forEach((inter) => {
	const toggle = inter.querySelector('.interested-toggle');
	const interestedList = inter.querySelectorAll('.interested');
	const interestedToggle = inter.querySelector('.interested-arrow');
	toggle.addEventListener('click', (e) => {
		interestedToggle.classList.toggle('active');
		interestedList.forEach((interestedLeader) =>
			interestedLeader.classList.toggle('active')
		);
	});
});

const descriptions = document.querySelectorAll('.description');
for (let i = 0; i < descriptions.length; i++) {
	const description = new Quill(`#description-${i}`, {
		theme: 'bubble',
		readOnly: true,
	});
	try {
		description.setContents(JSON.parse(description.getText()));
	} catch (error) {
		continue;
	}
}
