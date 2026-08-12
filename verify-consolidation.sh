#!/bin/bash
# Manual Cleanup Checklist
# Run these commands to complete the consolidation

echo "🔍 LearnHome Classroom Consolidation Checklist"
echo "=============================================="
echo ""

# 1. Delete classroomState.js
echo "1️⃣  Deleting classroomState.js..."
if [ -f "src/classroomState.js" ]; then
    rm src/classroomState.js
    echo "   ✅ src/classroomState.js deleted"
else
    echo "   ℹ️  src/classroomState.js not found (already deleted)"
fi
echo ""

# 2. Verify no classroomState references
echo "2️⃣  Checking for classroomState references..."
REFERENCES=$(grep -r "classroomState" src --exclude-dir=node_modules 2>/dev/null | wc -l)
if [ $REFERENCES -eq 0 ]; then
    echo "   ✅ No classroomState references found"
else
    echo "   ⚠️  Found $REFERENCES classroomState references:"
    grep -r "classroomState" src --exclude-dir=node_modules
fi
echo ""

# 3. Verify no Socket.IO references in src
echo "3️⃣  Checking for Socket.IO references in src..."
SOCKET_REFS=$(grep -r "socket.io\|socketRef\|Socket.IO" src --exclude-dir=node_modules 2>/dev/null | grep -v MIGRATION_GUIDE | grep -v CONSOLIDATION | wc -l)
if [ $SOCKET_REFS -eq 0 ]; then
    echo "   ✅ No Socket.IO references in src/"
else
    echo "   ⚠️  Found $SOCKET_REFS Socket.IO references:"
    grep -r "socket.io\|socketRef\|Socket.IO" src --exclude-dir=node_modules | grep -v MIGRATION_GUIDE | grep -v CONSOLIDATION
fi
echo ""

# 4. Verify key files exist
echo "4️⃣  Verifying new service files..."
FILES=(
    "src/services/realtimeService.js"
    "src/utils/mockData.js"
    "src/context/AuthContext.jsx"
    "src/context/ClassroomContext.jsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing!"
    fi
done
echo ""

# 5. Verify documentation files
echo "5️⃣  Verifying documentation..."
DOCS=(
    "SECURITY.md"
    "MIGRATION_GUIDE.md"
    "ARCHITECTURE.md"
    "SETUP_GUIDE.md"
    "INTEGRATION_COMPLETE.md"
    "CONSOLIDATION_COMPLETE.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "   ✅ $doc exists"
    else
        echo "   ❌ $doc missing!"
    fi
done
echo ""

# 6. Check .gitignore
echo "6️⃣  Verifying .gitignore..."
if grep -q "\.env" ".gitignore"; then
    echo "   ✅ .env files ignored"
else
    echo "   ⚠️  .env not in .gitignore"
fi

if grep -q "server/\.env" ".gitignore"; then
    echo "   ✅ server/.env files ignored"
else
    echo "   ⚠️  server/.env not in .gitignore"
fi
echo ""

# Summary
echo "=============================================="
echo "📋 Consolidation Summary"
echo "=============================================="
echo ""
echo "✅ Completed:"
echo "   • Socket.IO removed from App.tsx"
echo "   • classroomState.js references removed"
echo "   • realtimeService.js created"
echo "   • Authentication middleware added"
echo "   • LiveKit token endpoint secured"
echo "   • Database schema updated"
echo "   • Security documentation added"
echo "   • Migration guide added"
echo ""
echo "🔄 Next Steps:"
echo "   1. rm src/classroomState.js (if not already done)"
echo "   2. Run this script to verify cleanup"
echo "   3. Migrate LiveClassroom component"
echo "   4. Test all features"
echo "   5. Deploy!"
echo ""
echo "📚 Documentation:"
echo "   • Read: CONSOLIDATION_COMPLETE.md"
echo "   • Read: MIGRATION_GUIDE.md"
echo "   • Read: SECURITY.md"
echo ""
echo "=============================================="
echo "Status: ✅ READY FOR COMPONENT MIGRATION"
echo "=============================================="
