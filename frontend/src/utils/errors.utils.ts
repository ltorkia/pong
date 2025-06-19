export function showError(message: string) {
	const alertDiv = document.getElementById('alert');
	if (alertDiv) {
		const cautionIcon = '<i class="fa-solid fa-circle-exclamation"></i> ';
		alertDiv.innerHTML = cautionIcon + message;
		alertDiv.classList.remove('hidden');
	}
}