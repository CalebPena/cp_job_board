const interestedBtns = document.querySelectorAll('.interestedBtn');

const changeBtn = function (element, classId, jobId) {
	if (element.classList.contains('not-inter')) {
		axios
			.post(`/class/${classId}/${jobId}/interested`, {})
			.then((res) => {
				console.log(res);
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
				console.log(res);
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
