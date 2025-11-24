import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class Invoice {
  final String id; // Changed from int to String
  final String clienteId; // Changed from int to String
  final String numero;
  final int montoTotal;
  final String moneda;
  final String fechaEmision;
  final String? fechaVencimiento;
  final String estado;
  final String nombres;
  final String apellidos;
  final String cedula;

  Invoice({
    required this.id,
    required this.clienteId,
    required this.numero,
    required this.montoTotal,
    required this.moneda,
    required this.fechaEmision,
    this.fechaVencimiento,
    required this.estado,
    required this.nombres,
    required this.apellidos,
    required this.cedula,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) {
    try {
      return Invoice(
        id: json['id'] as String, // Cast as String
        clienteId: json['cliente_id'] as String, // Cast as String
        numero: json['numero'] as String,
        montoTotal: int.parse(json['monto_total'].toString()), // Keep this as int
        moneda: json['moneda'] as String,
        fechaEmision: json['fecha_emision'] as String,
        fechaVencimiento: json['fecha_vencimiento'] as String?,
        estado: json['estado'] as String,
        nombres: json['nombres'] as String,
        apellidos: json['apellidos'] as String,
        cedula: json['cedula'] as String,
      );
    } catch (e) {
      print('Error parsing Invoice from JSON: $e');
      print('Problematic JSON: $json');
      throw FormatException('Failed to parse invoice from server data.', e);
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'cliente_id': clienteId,
      'numero': numero,
      'monto_total': montoTotal,
      'moneda': moneda,
      'fecha_emision': fechaEmision,
      'fecha_vencimiento': fechaVencimiento,
      'estado': estado,
      'nombres': nombres,
      'apellidos': apellidos,
      'cedula': cedula,
    };
  }

  String get clienteNombreCompleto => '$nombres $apellidos';

  String get montoFormateado {
    final formatter = NumberFormat.currency(
      locale: 'es_CO',
      symbol: moneda == 'COP' ? '\$' : '\$',
      decimalDigits: 0,
    );
    return formatter.format(montoTotal);
  }

  bool get estaVencida {
    if (fechaVencimiento == null) return false;
    try {
      final fechaVencimientoDate = DateTime.parse(fechaVencimiento!);
      return fechaVencimientoDate.isBefore(DateTime.now());
    } catch (e) {
      return false;
    }
  }

  Color get estadoColor {
    switch (estado) {
      case 'pagada':
        return Colors.green;
      case 'pendiente':
        return Colors.orange;
      case 'vencida':
        return Colors.red;
      case 'anulada':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }
}