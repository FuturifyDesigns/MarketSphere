import 'package:flutter_test/flutter_test.dart';
import 'package:market_sphere/config.dart';

void main() {
  test('app is branded Market Sphere Group', () {
    expect(AppConfig.appName, 'Market Sphere Group');
  });
}
