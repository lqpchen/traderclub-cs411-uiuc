from rest_framework import serializers

from tradersclub.web.auth.AuthUtil import AuthUtil
from tradersclub.web.models import AppUser, DiscussionThread
from tradersclub.web.requests import NewDiscussionThreadRequest, UpdateDiscussionThreadReplyRequest


class AppUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    email = serializers.CharField(required=True, allow_blank=False, max_length=256)
    full_name = serializers.CharField(required=True, allow_blank=False, max_length=256)
    password = serializers.CharField(required=True, allow_blank=False, write_only=True)

    def create(self, validated_data):
        record = AppUser()
        record.email = validated_data.get("email")
        record.full_name = validated_data.get("full_name")
        password = validated_data.get("password")
        record.password = AuthUtil.get_hashed_salted_password(password)
        return record

    def update(self, instance, validated_data):
        pass


class StockUpdateDiscussionThreadReplyRequestSerializer(serializers.Serializer):
    content = serializers.CharField(required=True, allow_blank=False)
    position = serializers.BooleanField(required=True)
    sentiment = serializers.ChoiceField(required=True, choices=("buy", "sell", "hold"),
                                        allow_blank=False, write_only=True)
    parentReplyId = serializers.IntegerField(allow_null=True, required=False, default=None)

    def create(self, validated_data):
        record = UpdateDiscussionThreadReplyRequest()
        record.content = validated_data.get("content")
        record.position_held = validated_data.get("position")
        record.sentiment = validated_data.get("sentiment")
        record.parentReplyId = validated_data.get("parentReplyId")
        return record

    def update(self, instance, validated_data):
        pass


class StockNewDiscussionThreadRequestSerializer(serializers.Serializer):
    subject = serializers.CharField(required=True, max_length=1024)
    content = serializers.CharField(required=True, allow_blank=False)
    position = serializers.BooleanField(required=True)
    sentiment = serializers.ChoiceField(required=True, choices=("buy", "sell", "hold"),
                                        allow_blank=False, write_only=True)

    def create(self, validated_data):
        record = NewDiscussionThreadRequest()
        record.subject = validated_data.get("subject")
        record.content = validated_data.get("content")
        record.position_held = validated_data.get("position")
        record.sentiment = validated_data.get("sentiment")
        return record

    def update(self, instance, validated_data):
        pass


