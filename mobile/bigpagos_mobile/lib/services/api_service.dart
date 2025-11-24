import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:bigpagos_mobile/models/invoice.dart';

class ApiService {
  static const String baseUrl = 'http://10.51.180.209:3000'; // Para dispositivo físico

  Future<List<Invoice>> getInvoicesByCedula(String cedula) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/invoices?cedula=$cedula'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Invoice.fromJson(json)).toList();
      } else {
        throw Exception('Error al obtener facturas: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // This function now returns the full map of form parameters from the backend
  Future<Map<String, dynamic>> getWompiFormParams(String invoiceId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/payments/wompi-link'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'invoiceId': invoiceId,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception('Error al obtener datos del formulario: ${errorData['error'] ?? response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }
}
