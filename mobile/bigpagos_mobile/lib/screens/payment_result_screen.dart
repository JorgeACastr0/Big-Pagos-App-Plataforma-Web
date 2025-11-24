
import 'package:flutter/material.dart';

class PaymentResultScreen extends StatelessWidget {
  final String? transactionId;

  const PaymentResultScreen({Key? key, this.transactionId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // A simple status based on the presence of the ID.
    // In a real app, you would query your backend with this ID.
    final bool isSuccess = transactionId != null && transactionId!.isNotEmpty;
    final String message = isSuccess
        ? 'ID de Transacción: $transactionId'
        : 'No se recibió un ID de transacción.';
    final IconData icon = isSuccess ? Icons.check_circle : Icons.error;
    final Color color = isSuccess ? Colors.green : Colors.red;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Resultado del Pago'),
        automaticallyImplyLeading: false, // Hide back button
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 100, color: color),
              const SizedBox(height: 24),
              Text(
                isSuccess ? 'Pago Exitoso' : 'Error en el Pago',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // Navigate back to the invoice list
                    Navigator.of(context).pushNamedAndRemoveUntil(
                      '/invoices',
                      (route) => false,
                    );
                  },
                  child: const Text('Volver a Mis Facturas'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
