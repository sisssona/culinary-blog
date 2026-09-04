async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);

        // Проверка за успешен отговор
        if (response.ok) {
            // Ако е 204 No Content (например при изтриване)
            if (response.status === 204) return null;
            return await response.json();
        }

        // Обработка според HTTP статус кодовете от нашия ExceptionMiddleware
        const errorData = await response.json().catch(() => ({ message: "Възникна неочаквана грешка." }));

        switch (response.status) {
            case 400:
                showNotification(`Невалидна заявка: ${errorData.message || 'Моля, проверете въведените данни.'}`, 'warning');
                break;
            case 404:
                showNotification('Търсеният ресурс не беше намерен.', 'error');
                break;
            case 499:
                // Клиентът е затворил страницата или прекъснал заявката (Upload)
                console.warn('Заявката беше отменена от потребителя.');
                break;
            case 500:
                showNotification(errorData.message || 'Сървърна грешка. Моля, опитайте по-късно.', 'error');
                break;
            default:
                showNotification('Възникна неочаквана грешка.', 'error');
                break;
        }

        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);

    } catch (error) {
        // Улавяне на браузърно прекъсване на заявката (Fetch Abort)
        if (error.name === 'AbortError') {
            console.log('Заявката беше прекратена от потребителя (AbortController).');
            return;
        }

        // Препращаме грешката към извикващия код, ако е необходимо
        throw error;
    }
}

// Примерна помощна функция за визуализиране на съобщения (можеш да я замениш с Toastr или Bootstrap Alerts)
function showNotification(message, type) {
    console.log(`[${type.toUpperCase()}]: ${message}`);
    // Тук можеш да добавиш UI нотификация за потребителя
}