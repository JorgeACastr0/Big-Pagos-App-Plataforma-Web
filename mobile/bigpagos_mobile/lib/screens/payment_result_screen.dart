import 'package:bigpagos_mobile/services/api_service.dart';
import 'package:flutter/material.dart';

// Enum for different states of the screen
enum PaymentStatusState { loading, success, failed, pending, error }

class PaymentResultScreen extends StatefulWidget {
  final String? transactionId;

  const PaymentResultScreen({Key? key, this.transactionId}) : super(key: key);

  @override
  State<PaymentResultScreen> createState() => _PaymentResultScreenState();
}

class _PaymentResultScreenState extends State<PaymentResultScreen> {
  PaymentStatusState _status = PaymentStatusState.loading;
  String _message = '';
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _checkPaymentStatus();
  }

  Future<void> _checkPaymentStatus() async {
    if (widget.transactionId == null || widget.transactionId!.isEmpty) {
      setState(() {
        _status = PaymentStatusState.error;
        _message = 'No se recibió un ID de transacción.';
      });
      return;
    }

    try {
      final result = await _apiService.checkPaymentStatus(widget.transactionId!);
      final String wompiStatus = result['status'] ?? 'ERROR';

      setState(() {
        switch (wompiStatus.toUpperCase()) {
          case 'APPROVED':
            _status = PaymentStatusState.success;
            _message = 'Tu pago fue aprobado exitosamente.';
            break;
          case 'DECLINED':
            _status = PaymentStatusState.failed;
            _message = 'Tu pago fue declinado. Por favor, intenta con otro medio de pago.';
            break;
          case 'PENDING':
            _status = PaymentStatusState.pending;
            _message = 'Tu pago está pendiente. Te notificaremos cuando cambie el estado.';
            break;
          default:
            _status = PaymentStatusState.error;
            _message = 'Ocurrió un error al verificar tu pago (Estado: $wompiStatus).';
        }
      });
    } catch (e) {
      setState(() {
        _status = PaymentStatusState.error;
        _message = 'Error de conexión: No se pudo verificar el estado del pago.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resultado del Pago'),
        automaticallyImplyLeading: false, // No back button
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_status == PaymentStatusState.loading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 20),
            Text('Verificando estado del pago...'),
          ],
        ),
      );
    }

    late IconData icon;
    late Color color;
    late String title;

    switch (_status) {
      case PaymentStatusState.success:
        icon = Icons.check_circle;
        color = Colors.green;
        title = 'Pago Aprobado';
        break;
      case PaymentStatusState.failed:
        icon = Icons.cancel;
        color = Colors.red;
        title = 'Pago Declinado';
        break;
      case PaymentStatusState.pending:
        icon = Icons.watch_later;
        color = Colors.orange;
        title = 'Pago Pendiente';
        break;
      case PaymentStatusState.error:
        icon = Icons.error;
        color = Colors.red;
        title = 'Error en la Verificación';
        break;
      default:
        icon = Icons.help;
        color = Colors.grey;
        title = 'Estado Desconocido';
    }

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(icon, size: 100, color: color),
          const SizedBox(height: 24),
          Text(
            title,
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            _message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 48),
          ElevatedButton(
            onPressed: () {
              // Navigate back to the invoice list and force a refresh
              Navigator.of(context).pushNamedAndRemoveUntil('/invoices', (route) => false);
            },
            child: const Text('Volver a Mis Facturas'),
          ),
        ],
      ),
    );
  }
}
