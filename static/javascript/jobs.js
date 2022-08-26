const interestedBtns = document.querySelectorAll('.interested');

for (i = 0; i < interestedBtns.length; i++) {
	let btn = interestedBtns[i];
	let jobId = btn.getAttribute('jobId');
	console.log(jobId);
	btn.addEventListener('click', (e) => {
		e.preventDefault;
		axios
			.post(`/class/${classId}/${jobId}/interested`, {})
			.catch(function (error) {
				console.log(error);
			});
	});
}
