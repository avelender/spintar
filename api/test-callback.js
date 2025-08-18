// Простой тестовый callback для проверки
export default function handler(req, res) {
    console.log('🧪 [TEST] Test callback called');
    console.log('🧪 [TEST] Method:', req.method);
    console.log('🧪 [TEST] URL:', req.url);
    console.log('🧪 [TEST] Query:', JSON.stringify(req.query));
    
    res.status(200).json({
        success: true,
        message: 'Test callback working',
        method: req.method,
        url: req.url,
        query: req.query
    });
}
