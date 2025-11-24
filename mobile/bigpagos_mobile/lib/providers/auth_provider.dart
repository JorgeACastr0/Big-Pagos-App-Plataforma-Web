import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthProvider extends ChangeNotifier {
  String? _cedula;

  String? get cedula => _cedula;

  bool get isAuthenticated => _cedula != null;

  Future<void> setCedula(String cedula) async {
    _cedula = cedula;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('cedula', cedula);
    notifyListeners();
  }

  Future<void> loadCedula() async {
    final prefs = await SharedPreferences.getInstance();
    _cedula = prefs.getString('cedula');
    notifyListeners();
  }

  Future<void> logout() async {
    _cedula = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('cedula');
    notifyListeners();
  }
}
