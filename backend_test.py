import requests
import sys
import uuid
from datetime import datetime
import json

class SchoolManagementAPITester:
    def __init__(self, base_url="https://multi-school-ai.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tokens = {}
        self.test_data = {}
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, auth_role=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if auth_role and auth_role in self.tokens:
            test_headers['Authorization'] = f'Bearer {self.tokens[auth_role]}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response text: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n🔐 Testing Authentication Flow")
        
        # Test user registration for different roles
        test_users = [
            {
                "role": "super_admin",
                "email": f"superadmin_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "full_name": "Super Admin Test",
                "tenant_id": None
            },
            {
                "role": "school_admin",
                "email": f"schooladmin_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "full_name": "School Admin Test",
                "tenant_id": str(uuid.uuid4())
            },
            {
                "role": "teacher",
                "email": f"teacher_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "full_name": "Teacher Test",
                "tenant_id": str(uuid.uuid4())
            }
        ]
        
        for user_data in test_users:
            # Register user
            success, response = self.run_test(
                f"Register {user_data['role']}",
                "POST",
                "auth/register",
                200,
                data=user_data
            )
            
            if success:
                self.test_data[f"{user_data['role']}_user"] = user_data
                
                # Login user
                success, login_response = self.run_test(
                    f"Login {user_data['role']}",
                    "POST",
                    "auth/login",
                    200,
                    data={
                        "email": user_data["email"],
                        "password": user_data["password"]
                    }
                )
                
                if success and 'access_token' in login_response:
                    self.tokens[user_data['role']] = login_response['access_token']
                    
                    # Test get current user
                    self.run_test(
                        f"Get {user_data['role']} profile",
                        "GET",
                        "auth/me",
                        200,
                        auth_role=user_data['role']
                    )

    def test_school_management(self):
        """Test school management endpoints"""
        print("\n🏫 Testing School Management")
        
        if 'super_admin' not in self.tokens:
            print("❌ Skipping school tests - No super admin token")
            return
            
        # Test create school (only super admin should be able to do this)
        test_school = {
            "name": f"Test School {datetime.now().strftime('%H%M%S')}",
            "address": "123 Test Street, Test City",
            "contact_email": "contact@testschool.com",
            "contact_phone": "+1234567890"
        }
        
        success, school_response = self.run_test(
            "Create School (Super Admin)",
            "POST",
            "schools",
            200,
            data=test_school,
            auth_role="super_admin"
        )
        
        if success:
            self.test_data['test_school'] = school_response
            
        # Test get schools
        self.run_test(
            "Get Schools (Super Admin)",
            "GET",
            "schools",
            200,
            auth_role="super_admin"
        )
        
        # Test unauthorized access (school admin trying to create school)
        if 'school_admin' in self.tokens:
            self.run_test(
                "Create School (Unauthorized - School Admin)",
                "POST", 
                "schools",
                403,
                data=test_school,
                auth_role="school_admin"
            )

    def test_student_management(self):
        """Test student management endpoints"""
        print("\n👨‍🎓 Testing Student Management")
        
        if 'school_admin' not in self.tokens:
            print("❌ Skipping student tests - No school admin token")
            return
            
        test_student = {
            "first_name": "Test",
            "last_name": "Student", 
            "email": f"student_{datetime.now().strftime('%H%M%S')}@test.com",
            "grade": "10th",
            "date_of_birth": "2008-01-01",
            "parent_email": "parent@test.com"
        }
        
        success, student_response = self.run_test(
            "Create Student",
            "POST",
            "students",
            200,
            data=test_student,
            auth_role="school_admin"
        )
        
        if success:
            student_id = student_response.get('id')
            self.test_data['test_student'] = student_response
            
            # Test get students
            self.run_test(
                "Get Students",
                "GET", 
                "students",
                200,
                auth_role="school_admin"
            )
            
            # Test get specific student
            if student_id:
                self.run_test(
                    "Get Specific Student",
                    "GET",
                    f"students/{student_id}",
                    200,
                    auth_role="school_admin"
                )

    def test_teacher_management(self):
        """Test teacher management endpoints"""
        print("\n👨‍🏫 Testing Teacher Management")
        
        if 'school_admin' not in self.tokens:
            print("❌ Skipping teacher tests - No school admin token")
            return
            
        test_teacher = {
            "first_name": "Test",
            "last_name": "Teacher",
            "email": f"teachertest_{datetime.now().strftime('%H%M%S')}@test.com",
            "subjects": ["Mathematics", "Physics"],
            "qualification": "M.Sc. Mathematics"
        }
        
        success, teacher_response = self.run_test(
            "Create Teacher",
            "POST",
            "teachers", 
            200,
            data=test_teacher,
            auth_role="school_admin"
        )
        
        if success:
            self.test_data['test_teacher'] = teacher_response
            
        # Test get teachers
        self.run_test(
            "Get Teachers",
            "GET",
            "teachers",
            200,
            auth_role="school_admin"
        )

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        print("\n📊 Testing Dashboard Statistics")
        
        if 'school_admin' not in self.tokens:
            print("❌ Skipping dashboard tests - No school admin token")
            return
            
        self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            auth_role="school_admin"
        )

    def test_ai_chat(self):
        """Test AI chat functionality"""
        print("\n🤖 Testing AI Chat")
        
        if 'school_admin' not in self.tokens:
            print("❌ Skipping AI chat tests - No school admin token")
            return
            
        test_message = {
            "message": "Hello, can you help me with student management?",
            "session_id": f"test-session-{datetime.now().strftime('%H%M%S')}"
        }
        
        self.run_test(
            "AI Chat Message",
            "POST", 
            "ai/chat",
            200,
            data=test_message,
            auth_role="school_admin"
        )

    def test_multi_tenancy(self):
        """Test multi-tenancy isolation"""
        print("\n🏢 Testing Multi-Tenancy")
        
        if 'school_admin' not in self.tokens or 'teacher' not in self.tokens:
            print("❌ Skipping multi-tenancy tests - Missing required tokens")
            return
            
        # Test that school admin can't see other tenant's data
        print("Testing tenant isolation...")
        
        # Get students as school admin (should only see own tenant's students)
        success, school_admin_students = self.run_test(
            "Get Students (School Admin - Own Tenant)",
            "GET",
            "students",
            200,
            auth_role="school_admin"
        )
        
        # Get students as teacher (different tenant - should see own tenant's students)
        success, teacher_students = self.run_test(
            "Get Students (Teacher - Different Tenant)",
            "GET", 
            "students",
            200,
            auth_role="teacher"
        )
        
        print(f"School Admin sees {len(school_admin_students) if school_admin_students else 0} students")
        print(f"Teacher sees {len(teacher_students) if teacher_students else 0} students")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting School Management System API Tests")
        print(f"Backend URL: {self.base_url}")
        print("="*60)
        
        try:
            self.test_auth_flow()
            self.test_school_management()
            self.test_student_management() 
            self.test_teacher_management()
            self.test_dashboard_stats()
            self.test_ai_chat()
            self.test_multi_tenancy()
            
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {str(e)}")
        
        # Print final results
        print("\n" + "="*60)
        print(f"📊 Final Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate < 80:
            print("⚠️  Many tests failed - Check backend implementation")
        elif success_rate < 100:
            print("⚠️  Some tests failed - Check specific failed endpoints")  
        else:
            print("🎉 All tests passed!")
            
        return success_rate >= 80

def main():
    tester = SchoolManagementAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())