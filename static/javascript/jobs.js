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
		this.tags = [
			'Core',
			'Alumni',
			'Temp',
			'Part Time',
			'Remote',
			'Background Check',
			'Flexable Hours',
		];
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
	}
	_conditions() {
		const that = this;
		return function (job) {
			if (that.title && !that._in(job.jobTitle, that.title)) {
				return false;
			}
			if (that.careerTrack && !that._in(job.careerTracks, that.careerTrack)) {
				return false;
			}
			if (that.salary > job.salary) return false;
			if (that.salaryType && that.salaryType !== job.salaryType) {
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
		return str.indexOf(sub) !== -1;
	}
}

axios
	.get(`/class/${classId}/jobs`)
	.then((res) => {
		const filter = new Filter(res.data);

		const filterForm = document.querySelector('#filter-jobs');
		filterForm.addEventListener('submit', (ev) => {
			ev.preventDefault();
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
			filter.filter(formData);
		});
	})
	.catch(function (error) {
		console.error(error);
	});
