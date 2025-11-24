import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:bigpagos_mobile/providers/auth_provider.dart';

class CedulaInputScreen extends StatefulWidget {
  const CedulaInputScreen({super.key});

  @override
  State<CedulaInputScreen> createState() => _CedulaInputScreenState();
}

class _CedulaInputScreenState extends State<CedulaInputScreen> {
  final _formKey = GlobalKey<FormState>();
  final _cedulaController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _cedulaController.dispose();
    super.dispose();
  }

  void _submitCedula() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);

      try {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        await authProvider.setCedula(_cedulaController.text.trim());

        if (mounted) {
          Navigator.pushReplacementNamed(context, '/invoices');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: ${e.toString()}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Consulta de Facturas'),
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon/Illustration
              Center(
                child: Container(
                  width: 120,
                  height: 120,
                  margin: const EdgeInsets.only(bottom: 32),
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor.withValues(alpha: 50),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.person_search,
                    size: 60,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ),

              // Title
              const Text(
                'Ingresa tu número de cédula',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Necesitamos tu cédula para mostrar tus facturas pendientes',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.black54,
                ),
              ),
              const SizedBox(height: 32),

              // Form
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _cedulaController,
                      decoration: const InputDecoration(
                        labelText: 'Número de Cédula',
                        hintText: 'Ingresa tu cédula sin puntos ni comas',
                        prefixIcon: Icon(Icons.credit_card),
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      maxLength: 12,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Por favor ingresa tu cédula';
                        }
                        if (value.length < 6) {
                          return 'La cédula debe tener al menos 6 dígitos';
                        }
                        if (!RegExp(r'^\d+$').hasMatch(value)) {
                          return 'La cédula solo debe contener números';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submitCedula,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Consultar Facturas',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // Info text
              const Center(
                child: Text(
                  'Tus datos están seguros y protegidos',
                  style: TextStyle(
                    color: Colors.black38,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}